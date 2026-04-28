
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
import { api } from './services/api';
import { MOCK_QUEUE } from './constants';
import { Message, EventSuggestion, User, Group, Post, LeaderboardData, Song } from './types';
import { MessageSquare, LayoutGrid, Users, Trophy, FolderOpen } from 'lucide-react';

const App: React.FC = () => {
  // --- Global State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
  const [voiceParticipants, setVoiceParticipants] = useState<User[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Derived
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  // --- Initialization ---
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

  useEffect(() => {
    const init = async () => {
      if (currentUser) {
        const fetchedGroups = await api.getGroups();
        setGroups(fetchedGroups);
        
        if (fetchedGroups.length > 0) {
           // Only set if not already set or invalid
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

  // --- Handlers ---

  const handleAuth = async (email: string, password: string, name?: string, isRegister?: boolean) => {
    // Propagate errors to AuthScreen for UI display
    let user;
    if (isRegister && name) {
      user = await api.register(email, name, password);
    } else {
      user = await api.login(email, password);
    }
    setCurrentUser(user);
  };

  const handleSendMessage = async (text: string, eventDetails?: EventSuggestion) => {
    if (!currentUser) return;
    const newMessage = await api.sendMessage(text, currentUser.id, activeGroupId);
    setMessages(prev => [...prev, newMessage]);
    api.getLeaderboard(activeGroupId).then(setLeaderboardData);
  };

  const handleCreatePost = async (content: string) => {
    if (!currentUser) return;
    const newPost = await api.createPost(activeGroupId, currentUser.id, content);
    setPosts(prev => [newPost, ...prev]);
    api.getLeaderboard(activeGroupId).then(setLeaderboardData);
  };

  const handleCreateGroup = async (name: string, isPrivate: boolean, type: 'social' | 'work') => {
     if (!currentUser) return;
     const newGroup = await api.createGroup(name, isPrivate, type, currentUser);
     setGroups(prev => [...prev, newGroup]);
     setActiveGroupId(newGroup.id);
     // Optionally switch tabs if it's a work group
     if (type === 'work') setActiveTab('files');
     else setActiveTab('chat');
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

  if (!currentUser) {
    return <AuthScreen onLogin={handleAuth} />;
  }

  // Allow empty state if no groups exist yet
  if (groups.length === 0 && !activeGroupId) {
     return (
       <div className="flex h-screen items-center justify-center flex-col">
         <p className="mb-4">Welcome to Nexus. Creating your workspace...</p>
       </div>
     );
  }

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
                // Mocking role as Owner for demo user, in real app this comes from group members check
                userRole={currentUser.id === 'demo@nexus.com' ? 'owner' : 'member'} 
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
      />
    </div>
  );
};

export default App;
