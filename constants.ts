import { User, Group, Message, Post, Song, LeaderboardData } from './types';

// Default system user (optional)
export const SYSTEM_USER: User = {
  id: 'system',
  name: 'System',
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=System',
  status: 'online',
  notificationSound: 'Chirp'
};

// Empty initial states
export const USERS: User[] = [];
export const GROUPS: Group[] = [];
export const MOCK_MESSAGES: Record<string, Message[]> = {};
export const MOCK_POSTS: Record<string, Post[]> = {};
export const MOCK_QUEUE: Song[] = [
    { id: 's1', title: 'Demo Track 1', artist: 'Nexus Audio', cover: 'https://placehold.co/200/purple/white?text=1', duration: 180, platform: 'youtube' },
    { id: 's2', title: 'Demo Track 2', artist: 'Nexus Audio', cover: 'https://placehold.co/200/blue/white?text=2', duration: 200, platform: 'youtube' },
];
export const MOCK_LEADERBOARD: Record<string, LeaderboardData> = {};