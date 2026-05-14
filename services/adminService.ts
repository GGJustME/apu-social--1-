import { supabase } from './supabaseClient';
import { User } from '../types';

const mapProfile = (profile: any): User => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  avatar: profile.avatar_url,
  role: profile.role,
  accountStatus: profile.status,
  status: 'offline', // Admin view defaults to offline presence
  bio: profile.bio || '',
  notificationSound: profile.notification_sound || 'default',
});

export const adminService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapProfile);
  },

  async getUsersByStatus(status: 'active' | 'pending' | 'suspended'): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapProfile);
  },

  async updateUserStatus(userId: string, status: 'active' | 'pending' | 'suspended'): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return mapProfile(data);
  },

  async approveUser(userId: string): Promise<User> {
    return this.updateUserStatus(userId, 'active');
  },

  async suspendUser(userId: string): Promise<User> {
    return this.updateUserStatus(userId, 'suspended');
  },

  async reactivateUser(userId: string): Promise<User> {
    return this.updateUserStatus(userId, 'active');
  }
};
