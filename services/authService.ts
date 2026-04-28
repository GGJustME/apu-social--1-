
import { supabase } from './supabaseClient';
import { User } from '../types';

export const authService = {
  /**
   * Initiates Google OAuth login flow.
   */
  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  },

  /**
   * Signs out the current user.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Fetches the user profile from the profiles table.
   * Includes retry logic to handle potential delays in profile creation via auth triggers.
   */
  async getProfile(userId: string, retries = 3, delay = 1000): Promise<User | null> {
    for (let i = 0; i < retries; i++) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar_url,
          role: profile.role,
          accountStatus: profile.status,
          status: 'online', // Default online presence
          bio: profile.bio || '',
          notificationSound: profile.notification_sound || 'default',
        };
      }

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching profile:', error);
        throw error;
      }

      // If profile not found, wait and retry
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return null;
  },
};
