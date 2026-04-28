
import { User, Group, Message, Post, LeaderboardData, Song, FileSystemItem, FolderPermissions, UserRole } from '../types';
import { MOCK_QUEUE } from '../constants';

const STORAGE_KEYS = {
  USERS: 'nexus_users',
  GROUPS: 'nexus_groups',
  MESSAGES: 'nexus_messages',
  POSTS: 'nexus_posts',
  FILES: 'nexus_files'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_PERMISSIONS: FolderPermissions = {
  view: ['owner', 'admin', 'member'],
  upload: ['owner', 'admin', 'member'],
  edit: ['owner', 'admin'],
  manage: ['owner']
};

const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
    const defaultGroup: Group = {
      id: 'general',
      name: 'General',
      icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=General',
      isPrivate: false,
      type: 'social',
      members: [],
      voiceActive: false
    };
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify([defaultGroup]));
  }
  
  // Initialize users with a Demo account if empty
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const demoUser: User = {
      id: 'demo@nexus.com',
      name: 'Demo User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
      status: 'online',
      notificationSound: 'Chirp',
      password: 'password',
      bio: 'Welcome to Nexus! This is a demo account.'
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([demoUser]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify([]));
  }
  
  // Initialize Mock Files
  if (!localStorage.getItem(STORAGE_KEYS.FILES)) {
    const rootFolders: FileSystemItem[] = [
      {
        id: 'f1', groupId: 'general', parentId: null, name: 'Documents', type: 'folder', 
        createdAt: new Date().toISOString(), createdBy: 'system', updatedAt: new Date().toISOString(), permissions: DEFAULT_PERMISSIONS
      },
      {
        id: 'f2', groupId: 'general', parentId: null, name: 'Images', type: 'folder', 
        createdAt: new Date().toISOString(), createdBy: 'system', updatedAt: new Date().toISOString(), permissions: DEFAULT_PERMISSIONS
      },
      {
        id: 'f3', groupId: 'general', parentId: null, name: 'Management', type: 'folder', 
        createdAt: new Date().toISOString(), createdBy: 'system', updatedAt: new Date().toISOString(), 
        permissions: { view: ['owner', 'admin'], upload: ['owner', 'admin'], edit: ['owner'], manage: ['owner'] }
      },
      {
        id: 'file1', groupId: 'general', parentId: 'f1', name: 'Project_Specs.pdf', type: 'pdf', size: 1024 * 1024 * 2.5,
        createdAt: new Date().toISOString(), createdBy: 'system', updatedAt: new Date().toISOString(), permissions: DEFAULT_PERMISSIONS
      }
    ];
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(rootFolders));
  }
};

try {
  initializeStorage();
} catch (e) {
  console.error("LocalStorage unavailable", e);
}

export const api = {
  login: async (email: string, password: string): Promise<User> => {
    await delay(500);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.id === email);

    if (!user) {
      throw new Error("User not found. Please register.");
    }

    if (user.password !== password) {
      throw new Error("Invalid password");
    }

    return user;
  },

  register: async (email: string, username: string, password: string): Promise<User> => {
    await delay(500);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    if (users.find(u => u.id === email)) {
      throw new Error("Email already registered");
    }

    const newUser: User = {
      id: email, // Using email as ID for simplicity
      name: username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      status: 'online',
      notificationSound: 'Chirp',
      password: password,
      bio: "Hello, I'm new here!"
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Auto-join public groups
    const groups: Group[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]');
    let updated = false;
    const updatedGroups = groups.map(g => {
      if (!g.isPrivate && !g.members.some(m => m.id === newUser.id)) {
        updated = true;
        return { ...g, members: [...g.members, newUser] };
      }
      return g;
    });
    
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(updatedGroups));
    }

    return newUser;
  },

  updateUserProfile: async (userId: string, updates: Partial<User>): Promise<User> => {
    await delay(300);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) throw new Error("User not found");
    
    // Merge updates
    const updatedUser = { ...users[index], ...updates };
    users[index] = updatedUser;
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return updatedUser;
  },

  // ... existing group/message methods ...
  getGroups: async (): Promise<Group[]> => {
    await delay(200);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]');
  },

  createGroup: async (name: string, isPrivate: boolean, type: 'social' | 'work', creator: User): Promise<Group> => {
    await delay(300);
    const groups: Group[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]');
    const newGroup: Group = {
      id: generateId(),
      name,
      isPrivate,
      type,
      icon: `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
      members: [creator],
      voiceActive: false
    };
    groups.push(newGroup);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    return newGroup;
  },

  addMemberToGroup: async (groupId: string, newUserEmail: string): Promise<User | null> => {
    await delay(300);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const groups: Group[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]');
    
    const userToAdd = users.find(u => u.id === newUserEmail);
    const groupIndex = groups.findIndex(g => g.id === groupId);

    if (userToAdd && groupIndex !== -1) {
      if (!groups[groupIndex].members.some(m => m.id === userToAdd.id)) {
        groups[groupIndex].members.push(userToAdd);
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
        return userToAdd;
      }
    } 
    return null;
  },

  getMessages: async (groupId: string): Promise<Message[]> => {
    await delay(200);
    const allMessages: Message[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    return allMessages
      .filter(m => m.groupId === groupId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  sendMessage: async (content: string, senderId: string, groupId: string, type: 'text' | 'image' = 'text'): Promise<Message> => {
    await delay(200);
    const allMessages: Message[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    
    const newMessage: Message = {
      id: generateId(),
      senderId,
      groupId,
      content,
      type,
      timestamp: new Date().toISOString()
    };

    allMessages.push(newMessage);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
    return newMessage;
  },

  getPosts: async (groupId: string): Promise<Post[]> => {
    await delay(200);
    const allPosts: Post[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]');
    return allPosts
        .filter(p => (p as any).groupId === groupId || !(p as any).groupId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  createPost: async (groupId: string, authorId: string, content: string): Promise<Post> => {
      await delay(300);
      const allPosts: Post[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || '[]');
      const newPost: Post = {
          id: generateId(),
          authorId,
          content,
          likes: 0,
          comments: 0,
          timestamp: new Date().toISOString(),
          // @ts-ignore
          groupId: groupId 
      };
      allPosts.push(newPost);
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
      return newPost;
  },

  getLeaderboard: async (groupId: string): Promise<LeaderboardData> => {
    await delay(300);
    const allMessages: Message[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    const groupMessages = allMessages.filter(m => m.groupId === groupId);
    
    const userStats: Record<string, any> = {};
    const wordCounts: Record<string, number> = {};

    groupMessages.forEach(msg => {
      if (!userStats[msg.senderId]) {
        userStats[msg.senderId] = { messageCount: 0, score: 0, reactionsGiven: 0, voiceMinutes: 0 };
      }
      userStats[msg.senderId].messageCount++;
      userStats[msg.senderId].score += 10;
      
      const words = msg.content.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
      words.forEach(w => {
        if (w.length > 3) wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
    });

    const mostUsedWord = Object.entries(wordCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    const entries = Object.entries(userStats).map(([userId, stats]) => ({
      userId,
      ...stats,
      voiceMinutes: Math.floor(Math.random() * 50),
      reactionsGiven: Math.floor(Math.random() * 20)
    }));

    if (entries.length === 0) {
        return {
            monthly: { entries: [], stats: { mostUsedWord: '-', topGenre: '-', totalFeedPosts: 0, totalMessages: 0 } },
            annual: { entries: [], stats: { mostUsedWord: '-', topGenre: '-', totalFeedPosts: 0, totalMessages: 0 } }
        };
    }

    return {
      monthly: {
        entries,
        stats: {
          mostUsedWord,
          topGenre: 'Lo-Fi',
          totalFeedPosts: 0,
          totalMessages: groupMessages.length
        }
      },
      annual: {
        entries,
        stats: {
          mostUsedWord,
          topGenre: 'Pop',
          totalFeedPosts: 0,
          totalMessages: groupMessages.length
        }
      }
    };
  },

  searchMusic: async (query: string): Promise<Song[]> => {
    await delay(600);
    return [
      { id: generateId(), title: `${query} (Official Video)`, artist: 'Unknown Artist', cover: `https://placehold.co/320x180/red/white?text=${query}`, duration: 240, platform: 'youtube', videoId: 'mock1' },
      { id: generateId(), title: `${query} - Live Performance`, artist: 'Famous Band', cover: `https://placehold.co/320x180/black/white?text=Live`, duration: 320, platform: 'youtube', videoId: 'mock2' },
      { id: generateId(), title: `Best of ${query} Mix`, artist: 'DJ Nexus', cover: `https://placehold.co/320x180/blue/white?text=Mix`, duration: 1200, platform: 'youtube', videoId: 'mock3' },
    ];
  },

  // --- FILES API ---

  getFiles: async (groupId: string, parentId: string | null): Promise<FileSystemItem[]> => {
    await delay(100);
    const files: FileSystemItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    return files.filter(f => f.groupId === groupId && f.parentId === parentId);
  },

  createFolder: async (groupId: string, parentId: string | null, name: string, creatorId: string, permissions: FolderPermissions = DEFAULT_PERMISSIONS): Promise<FileSystemItem> => {
    await delay(200);
    const files: FileSystemItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const newFolder: FileSystemItem = {
      id: generateId(),
      groupId,
      parentId,
      name,
      type: 'folder',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: creatorId,
      permissions
    };
    files.push(newFolder);
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    return newFolder;
  },

  uploadFile: async (groupId: string, parentId: string | null, file: File, creatorId: string, permissions: FolderPermissions): Promise<FileSystemItem> => {
    await delay(500); // Simulate upload
    const files: FileSystemItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    
    let type: FileSystemItem['type'] = 'unknown';
    if (file.type.includes('pdf')) type = 'pdf';
    else if (file.type.includes('image')) type = 'image';
    else if (file.type.includes('video')) type = 'video';
    else if (file.type.includes('audio')) type = 'audio';
    
    const newFile: FileSystemItem = {
      id: generateId(),
      groupId,
      parentId,
      name: file.name,
      type,
      size: file.size,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: creatorId,
      permissions,
      url: URL.createObjectURL(file) // Mock URL for preview
    };
    
    files.push(newFile);
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    return newFile;
  },

  deleteFileItem: async (itemId: string): Promise<void> => {
    await delay(200);
    let files: FileSystemItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    
    // Recursive delete function for folders
    const deleteRecursive = (idsToDelete: string[]) => {
      if (idsToDelete.length === 0) return;
      
      const children = files.filter(f => f.parentId && idsToDelete.includes(f.parentId)).map(f => f.id);
      
      // Remove current batch
      files = files.filter(f => !idsToDelete.includes(f.id));
      
      // Recurse
      deleteRecursive(children);
    };

    deleteRecursive([itemId]);
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
  },

  updateFilePermissions: async (itemId: string, permissions: FolderPermissions): Promise<void> => {
    await delay(200);
    const files: FileSystemItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const index = files.findIndex(f => f.id === itemId);
    if (index !== -1) {
      files[index].permissions = permissions;
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    }
  },

  renameItem: async (itemId: string, newName: string): Promise<void> => {
    await delay(100);
    const files: FileSystemItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const item = files.find(f => f.id === itemId);
    if (item) {
      item.name = newName;
      item.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    }
  },
  
  // Helper to get folder details to check permissions
  getFileItem: async (itemId: string): Promise<FileSystemItem | undefined> => {
    const files: FileSystemItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    return files.find(f => f.id === itemId);
  }
};
