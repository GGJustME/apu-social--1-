import { User, Group, Message, Post, LeaderboardData, Song, FileSystemItem, FolderPermissions, UserRole } from '../types';
import { MOCK_QUEUE } from '../constants';
import { groupService } from './groupService';
import { chatService } from './chatService';
import { fileService } from './fileService';
import { postService } from './postService';
import { adminService } from './adminService';

const STORAGE_KEYS = {
  USERS: 'nexus_users',
  MESSAGES: 'nexus_messages'
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
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const demoUser: User = {
      id: 'demo@nexus.com',
      name: 'Demo User',
      email: 'demo@nexus.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
      status: 'online',
      accountStatus: 'active',
      role: 'member',
      bio: 'Welcome to Nexus! This is a demo account.'
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([demoUser]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
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
    if (!user) throw new Error("User not found.");
    return user;
  },

  register: async (email: string, username: string, password: string): Promise<User> => {
    await delay(500);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (users.find(u => u.id === email)) throw new Error("Email already registered");
    const newUser: User = {
      id: email,
      name: username,
      email: email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      status: 'online',
      accountStatus: 'active',
      role: 'member',
      bio: "Hello, I'm new here!"
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  updateUserProfile: async (userId: string, updates: Partial<User>): Promise<User> => {
    await delay(300);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error("User not found");
    const updatedUser = { ...users[index], ...updates };
    users[index] = updatedUser;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return updatedUser;
  },

  // Delegated Group Methods
  getGroups: async (userId: string): Promise<Group[]> => {
    return groupService.getMyGroups(userId);
  },

  createGroup: async (name: string, isPrivate: boolean, type: 'social' | 'work', creatorId: string): Promise<Group> => {
    return groupService.createGroup(name, isPrivate, type, creatorId);
  },

  addMemberToGroup: async (groupId: string, newUserEmail: string): Promise<User | null> => {
    console.warn("addMemberToGroup: Use invite links for Phase 1.");
    return null;
  },

  joinGroupViaInvite: async (inviteCode: string): Promise<string> => {
    return groupService.joinGroupViaInvite(inviteCode);
  },

  // Local Storage fallback for other features during transition
  getMessages: async (groupId: string): Promise<Message[]> => {
    return chatService.getMessages(groupId);
  },

  sendMessage: async (content: string, senderId: string, groupId: string, type: 'text' | 'image' = 'text', eventDetails?: any): Promise<Message> => {
    return chatService.sendMessage(content, senderId, groupId, type, eventDetails);
  },

  getPosts: async (groupId: string): Promise<Post[]> => {
    return postService.getPosts(groupId);
  },

  createPost: async (groupId: string, authorId: string, content: string): Promise<Post> => {
    return postService.createPost(groupId, authorId, content);
  },

  deletePost: async (postId: string): Promise<void> => {
    return postService.deletePost(postId);
  },

  getLeaderboard: async (groupId: string): Promise<LeaderboardData> => {
    await delay(300);
    const allMessages: Message[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    const groupMessages = allMessages.filter(m => m.groupId === groupId);
    const userStats: Record<string, any> = {};
    groupMessages.forEach(msg => {
      if (!userStats[msg.senderId]) userStats[msg.senderId] = { messageCount: 0, score: 0, reactionsGiven: 0, voiceMinutes: 0 };
      userStats[msg.senderId].messageCount++;
      userStats[msg.senderId].score += 10;
    });
    const entries = Object.entries(userStats).map(([userId, stats]) => ({
      userId,
      ...stats,
      voiceMinutes: 10,
      reactionsGiven: 5
    }));
    return {
      monthly: { entries, stats: { mostUsedWord: 'nexus', topGenre: 'Lo-Fi', totalFeedPosts: 0, totalMessages: groupMessages.length } },
      annual: { entries, stats: { mostUsedWord: 'nexus', topGenre: 'Pop', totalFeedPosts: 0, totalMessages: groupMessages.length } }
    };
  },

  searchMusic: async (query: string): Promise<Song[]> => {
    await delay(600);
    return [{ id: generateId(), title: `${query} Mix`, artist: 'Nexus', cover: 'https://placehold.co/300', duration: 300, platform: 'youtube', videoId: 'abc' }];
  },

  getFiles: async (groupId: string, parentId: string | null): Promise<FileSystemItem[]> => {
    return fileService.getFiles(groupId, parentId);
  },

  createFolder: async (groupId: string, parentId: string | null, name: string, creatorId: string, permissions: FolderPermissions = DEFAULT_PERMISSIONS): Promise<FileSystemItem> => {
    return fileService.createFolder(groupId, parentId, name, creatorId);
  },

  uploadFile: async (groupId: string, parentId: string | null, file: File, creatorId: string, permissions: FolderPermissions): Promise<FileSystemItem> => {
    return fileService.uploadFile(groupId, parentId, file, creatorId);
  },

  deleteFileItem: async (itemId: string): Promise<void> => {
    return fileService.deleteFileItem(itemId);
  },

  updateFilePermissions: async (itemId: string, permissions: FolderPermissions): Promise<void> => {
    // TODO: Implement custom folder permissions in future phase
    console.warn("updateFilePermissions: RLS currently handles access. Custom perms out of scope for v1.1.9.");
  },

  renameItem: async (itemId: string, newName: string): Promise<void> => {
    return fileService.renameItem(itemId, newName);
  },

  getFileItem: async (itemId: string): Promise<FileSystemItem | undefined> => {
    return fileService.getFileItem(itemId);
  },

  getSignedUrl: async (storagePath: string): Promise<string> => {
    return fileService.getSignedUrl(storagePath);
  },

  // Admin Methods
  getUsers: async (): Promise<User[]> => {
    return adminService.getUsers();
  },

  getUsersByStatus: async (status: 'active' | 'pending' | 'suspended'): Promise<User[]> => {
    return adminService.getUsersByStatus(status);
  },

  updateUserStatus: async (userId: string, status: 'active' | 'pending' | 'suspended'): Promise<User> => {
    return adminService.updateUserStatus(userId, status);
  },

  approveUser: async (userId: string): Promise<User> => {
    return adminService.approveUser(userId);
  },

  suspendUser: async (userId: string): Promise<User> => {
    return adminService.suspendUser(userId);
  },

  reactivateUser: async (userId: string): Promise<User> => {
    return adminService.reactivateUser(userId);
  }
};
