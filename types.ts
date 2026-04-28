
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  accountStatus: 'active' | 'pending' | 'suspended';
  role: 'admin' | 'member';
  bio?: string;
  notificationSound?: string;
}

export type UserRole = 'owner' | 'admin' | 'member';

export interface GroupMember extends User {
  role: UserRole;
}

export interface Message {
  id: string;
  senderId: string;
  groupId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'sticker';
  reactions?: Record<string, number>;
  isEventSuggestion?: boolean;
  eventDetails?: EventSuggestion;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  isPrivate: boolean;
  type: 'social' | 'work';
  members: User[];
  voiceActive: boolean;
  ownerId?: string;
  memberCount?: number;
}

export interface Invite {
  id: string;
  groupId: string;
  inviteCode: string;
  isRevoked: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
}

export interface EventSuggestion {
  title: string;
  start: string;
  end?: string;
  location?: string;
  description?: string;
  confidence: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: number;
  platform: 'youtube' | 'spotify';
  videoId?: string; // For YouTube integration
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
  messageCount: number;
  voiceMinutes: number;
  reactionsGiven: number;
}

export interface GroupStats {
  mostUsedWord: string;
  topGenre: string;
  totalFeedPosts: number;
  totalMessages: number;
}

export interface LeaderboardSection {
  entries: LeaderboardEntry[];
  stats: GroupStats;
}

export interface LeaderboardData {
  monthly: LeaderboardSection;
  annual: LeaderboardSection;
}

// --- File System Types ---

export type FileType = 'folder' | 'pdf' | 'image' | 'doc' | 'video' | 'audio' | 'archive' | 'unknown';

export interface FolderPermissions {
  view: UserRole[];
  upload: UserRole[];
  edit: UserRole[]; // rename, move, delete
  manage: UserRole[]; // change permissions
}

export interface FileSystemItem {
  id: string;
  groupId: string;
  parentId: string | null; // null if root
  name: string;
  type: FileType;
  size?: number; // in bytes, undefined for folders
  mimeType?: string;
  url?: string; // for preview
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  permissions: FolderPermissions; // Files inherit from parent folder usually, but we store it for folders
}
