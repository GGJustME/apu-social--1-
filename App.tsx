
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Feed } from './components/Feed';
import { MusicPlayer } from './components/MusicPlayer';
import { VoiceRoom } from './components/VoiceRoom';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { AuthScreen } from './components/AuthScreen';
import { FileExplorer } from './components/FileExplorer';
import { JoinGroupModal } from './components/JoinGroupModal';
import { InviteLinkModal } from './components/InviteLinkModal';
import { api } from './services/api';
import { supabase } from './services/supabaseClient';
import { authService } from './services/authService';
import { chatService } from './services/chatService';
import { MOCK_QUEUE } from './constants';
import { Message, EventSuggestion, User, Group, Post, LeaderboardData, Song } from './types';
import { MessageSquare, LayoutGrid, Users, Trophy, FolderOpen, Loader2, LogOut, AlertTriangle, Clock, UserPlus } from 'lucide-react';

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- App State ---
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'feed' | 'chat' | 'voice' | 'leaderboard' | 'files'>('chat');
  
  // --- Data State ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [usersCache, setUsersCache] = useState<User[]>([]);

  // --- Music State ---
  const [musicQueue, setMusicQueue] = useState<Song[]>(MOCK_QUEUE);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- UI State ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState<User[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // --- Auth Initialization ---
// ... (keep auth effect)
  useEffect(() => {
    const handleProfileFetch = async (userId: string) => {
      try {
        const profile = await authService.getProfile(userId);
        if (profile) {
          setCurrentUser(profile);
        } else {
          setAuthError("Profile not found. Please contact an admin if this persists.");
        }
      } catch (err: any) {
        setAuthError(err.message || "Failed to load user profile");
      } finally {
        setAuthLoading(false);
      }
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleProfileFetch(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleProfileFetch(session.user.id);
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Data Initialization ---
  useEffect(() => {
    const init = async () => {
      if (currentUser && currentUser.accountStatus === 'active') {
        const fetchedGroups = await api.getGroups(currentUser.id);
        setGroups(fetchedGroups);
        
        if (fetchedGroups.length > 0) {
           if (!activeGroupId || !fetchedGroups.find(g => g.id === activeGroupId)) {
             setActiveGroupId(fetchedGroups[0].id);
           }
        }
        
        const allMembers = fetchedGroups.flatMap(g => g.members);
        const unique = Array.from(new Map(allMembers.map(item => [item.id, item])).values());
        setUsersCache(unique);
      }
    };
    init();
  }, [currentUser]);

  // --- Group Change Effect ---
  useEffect(() => {
    if (activeGroupId) {
      refreshData(activeGroupId);
    }
  }, [activeGroupId]);

  const refreshData = async (groupId: string) => {
    if (!groupId) return;
    const [msgs, feedPosts, lb] = await Promise.all([
      api.getMessages(groupId),
      api.getPosts(groupId),
      api.getLeaderboard(groupId)
    ]);
    setMessages(msgs);
    setPosts(feedPosts);
    setLeaderboardData(lb);
  };

  // --- Real-time Chat Subscription ---
  useEffect(() => {
    if (!activeGroupId) return;

    const cleanup = chatService.subscribeToMessages(activeGroupId, (newMsg) => {
      setMessages((prev) => {
        // Prevent duplicate messages (especially when sending from this client)
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => cleanup();
  }, [activeGroupId]);

  // --- Handlers ---
  const handleGoogleLogin = async () => {
    await authService.signInWithGoogle();
  };

  const handleLogout = async () => {
    await authService.signOut();
  };

  const handleSendMessage = async (text: string, eventDetails?: EventSuggestion) => {
    if (!currentUser || !activeGroupId) return;
    try {
      const newMessage = await api.sendMessage(text, currentUser.id, activeGroupId, 'text', eventDetails);
      // Real-time listener will likely pick this up, but we add it optimistically if not already there
      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      api.getLeaderboard(activeGroupId).then(setLeaderboardData);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleCreatePost = async (content: string) => {
    if (!currentUser) return;
    const newPost = await api.createPost(activeGroupId, currentUser.id, content);
    setPosts(prev => [newPost, ...prev]);
    api.getLeaderboard(activeGroupId).then(setLeaderboardData);
  };

  const handleCreateGroup = async (name: string, isPrivate: boolean, type: 'social' | 'work') => {
     if (!currentUser) return;
     const newGroup = await api.createGroup(name, isPrivate, type, currentUser.id);
     setGroups(prev => [...prev, newGroup]);
     setActiveGroupId(newGroup.id);
     if (type === 'work') setActiveTab('files');
     else setActiveTab('chat');
  };

  const handleJoinGroup = async (inviteCode: string) => {
    try {
      const groupId = await api.joinGroupViaInvite(inviteCode);
      const fetchedGroups = await api.getGroups(currentUser!.id);
      setGroups(fetchedGroups);
      setActiveGroupId(groupId);
      setActiveTab('chat');
    } catch (err: any) {
      alert(err.message || "Failed to join group");
    }
  };

  const handleJoinPublic = async (groupId: string) => {
    try {
      // Assuming api.joinPublicGroup is implemented in api.ts
      // If not, we can delegate to groupService.joinPublicGroup
      const { groupService } = await import('./services/groupService');
      await groupService.joinPublicGroup(groupId);
      const fetchedGroups = await api.getGroups(currentUser!.id);
      setGroups(fetchedGroups);
      setActiveGroupId(groupId);
      setActiveTab('chat');
    } catch (err: any) {
      alert(err.message || "Failed to join group");
    }
  };

  const handleAddMember = async (email: string) => {
    if (!activeGroupId) return;
    const userAdded = await api.addMemberToGroup(activeGroupId, email);
    if (userAdded) {
      alert(`Added ${userAdded.name} to the group!`);
      setUsersCache(prev => [...prev, userAdded]);
    } else {
      alert("Could not add user. They might already be in the group or not found.");
    }
  };

  const handleJoinVoice = () => {
    if(!currentUser) return;
    setVoiceParticipants([currentUser]); 
    setActiveTab('voice');
  };

  const handleLeaveVoice = () => {
    setVoiceParticipants([]);
    setActiveTab('chat');
  };

  // --- Rendering States ---
// ... (keep rendering logic)
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-nexus-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Initializing Nexus...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-white">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-8">{authError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-nexus-600 text-white py-3 rounded-xl font-semibold hover:bg-nexus-700 transition-colors"
          >
            Retry Login
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onGoogleLogin={handleGoogleLogin} />;
  }

  if (currentUser.accountStatus === 'pending') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-white">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pending Approval</h2>
          <p className="text-slate-500 mb-8">Your account is waiting for admin approval.</p>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full text-slate-500 font-medium hover:text-red-500 transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (currentUser.accountStatus === 'suspended') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-white">
          <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Suspended</h2>
          <p className="text-slate-500 mb-8">Your account has been suspended.</p>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full text-slate-500 font-medium hover:text-red-500 transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Derived Active Group
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  return (
    <div className="flex h-screen w-screen bg-white">
      {/* Sidebar */}
      <Sidebar 
        groups={groups} 
        activeGroupId={activeGroupId} 
        onSelectGroup={(id) => {
          setActiveGroupId(id);
          const group = groups.find(g => g.id === id);
          if (activeTab === 'files' && group?.type !== 'work') {
              setActiveTab('chat');
          }
          if (activeTab === 'voice') setActiveTab('chat');
        }}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        onCreateGroup={handleCreateGroup}
        onOpenJoinModal={() => setIsJoinModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Navigation Bar */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">{activeGroup?.name || 'Nexus'}</h1>
            {activeGroup?.isPrivate && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">Private Group</span>
            )}
            {activeGroup?.type === 'work' && (
               <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">Workspace</span>
            )}
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="p-2 text-slate-400 hover:text-nexus-600 hover:bg-slate-100 rounded-lg transition-all"
              title="Invite Members"
            >
              <UserPlus size={18} />
            </button>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'feed' ? 'bg-white text-nexus-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid size={16} /> <span className="hidden sm:inline">Feed</span>
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'chat' ? 'bg-white text-nexus-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MessageSquare size={16} /> <span className="hidden sm:inline">Chat</span>
            </button>
            
            {activeGroup?.type === 'work' && (
                <button 
                onClick={() => setActiveTab('files')}
                className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'files' ? 'bg-white text-nexus-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                <FolderOpen size={16} /> <span className="hidden sm:inline">Workspace</span>
                </button>
            )}

            <button 
              onClick={() => {
                if(voiceParticipants.length === 0) handleJoinVoice();
                else setActiveTab('voice');
              }}
              className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'voice' ? 'bg-white text-nexus-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Users size={16} /> <span className="hidden sm:inline">Voice</span>
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'leaderboard' ? 'bg-white text-nexus-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Trophy size={16} /> <span className="hidden sm:inline">Leaderboard</span>
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' && (
            <ChatArea 
              messages={messages} 
              currentUser={currentUser} 
              onSendMessage={handleSendMessage}
              channelName={activeGroup?.name || 'Chat'}
              onAddMember={handleAddMember}
            />
          )}
          {activeTab === 'feed' && (
            <Feed posts={posts} onPost={handleCreatePost} />
          )}
          {activeTab === 'files' && activeGroup?.type === 'work' && (
            <FileExplorer 
                groupId={activeGroupId} 
                currentUser={currentUser}
                userRole={currentUser.role} 
            />
          )}
          {activeTab === 'voice' && (
            <VoiceRoom 
              participants={voiceParticipants} 
              onLeave={handleLeaveVoice}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
            />
          )}
          {activeTab === 'leaderboard' && leaderboardData && (
            <Leaderboard 
              data={leaderboardData}
              users={usersCache}
              groupName={activeGroup?.name || 'Group'}
            />
          )}
        </div>
      </div>

      {/* Floating Music Player (Global) */}
      <MusicPlayer 
        currentSong={musicQueue[0]} 
        isPlaying={isPlaying} 
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        queue={musicQueue}
        onAddToQueue={(song) => setMusicQueue(prev => [...prev, song])}
      />

      {/* Profile Modal */}
      <ProfileModal 
        user={currentUser} 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onLogout={handleLogout}
      />

      {/* Join Group Modal */}
      <JoinGroupModal 
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoinByInvite={handleJoinGroup}
        onJoinPublic={handleJoinPublic}
      />

      {/* Invite Link Modal */}
      {activeGroup && (
        <InviteLinkModal 
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          groupId={activeGroup.id}
          groupName={activeGroup.name}
        />
      )}
    </div>
  );
};

export default App;
