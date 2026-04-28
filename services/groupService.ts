import { supabase } from './supabaseClient';
import { Group, User, Invite } from '../types';

const mapGroup = (dbGroup: any): Group => ({
  id: dbGroup.id,
  name: dbGroup.name,
  icon: dbGroup.icon_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${dbGroup.name}`,
  isPrivate: dbGroup.is_private,
  type: dbGroup.type,
  ownerId: dbGroup.owner_id,
  members: [], // Members loaded separately if needed
  voiceActive: false, // Placeholder for now
  memberCount: dbGroup.member_count?.[0]?.count || 0
});

export const groupService = {
  async getMyGroups(userId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*, member_count:group_members(count)')
      .in('id', (
        await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', userId)
      ).data?.map(m => m.group_id) || []);

    if (error) throw error;
    return (data || []).map(mapGroup);
  },

  async getPublicGroups(): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*, member_count:group_members(count)')
      .eq('is_private', false)
      .limit(10);

    if (error) throw error;
    return (data || []).map(mapGroup);
  },

  async createGroup(name: string, isPrivate: boolean, type: 'social' | 'work', ownerId: string): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        is_private: isPrivate,
        type,
        owner_id: ownerId,
        icon_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`
      })
      .select()
      .single();

    if (error) throw error;
    return mapGroup(data);
  },

  async joinPublicGroup(groupId: string): Promise<string> {
    const { data, error } = await supabase.rpc('join_public_group', { group_id_input: groupId });
    if (error) throw error;
    return data;
  },

  async joinGroupViaInvite(inviteCode: string): Promise<string> {
    const { data, error } = await supabase.rpc('join_group_via_invite', { invite_code_input: inviteCode });
    if (error) throw error;
    return data;
  },

  async getGroupMembers(groupId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('profiles(*)')
      .eq('group_id', groupId);

    if (error) throw error;
    return (data || []).map((m: any) => ({
      id: m.profiles.id,
      name: m.profiles.name,
      email: m.profiles.email,
      avatar: m.profiles.avatar_url,
      status: 'online',
      accountStatus: m.profiles.status,
      role: m.profiles.role,
      bio: m.profiles.bio,
      notificationSound: m.profiles.notification_sound
    }));
  },

  async getOrCreateInvite(groupId: string): Promise<Invite> {
    // Try to find existing active invite
    const { data: existing, error: findError } = await supabase
      .from('group_invites')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_revoked', false)
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("Invite lookup error:", findError);
      throw new Error(`Failed to check existing invites: ${findError.message}`);
    }

    if (existing) {
      return {
        id: existing.id,
        groupId: existing.group_id,
        inviteCode: existing.invite_code,
        isRevoked: existing.is_revoked,
        createdBy: existing.created_by,
        createdAt: existing.created_at
      };
    }

    // Create new if none found (handle collisions)
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data, error } = await supabase
        .from('group_invites')
        .insert({
          group_id: groupId,
          invite_code: inviteCode,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          groupId: data.group_id,
          inviteCode: data.invite_code,
          isRevoked: data.is_revoked,
          createdBy: data.created_by,
          createdAt: data.created_at
        };
      }

      if (error?.code === '23505') { // Unique violation
        retryCount++;
        continue;
      }

      console.error("Invite creation error:", error);
      throw new Error(error?.message || "Failed to create invite");
    }

    throw new Error("Failed to generate a unique invite code after several attempts.");
  },

  async revokeInvite(inviteId: string): Promise<void> {
    const { error } = await supabase
      .from('group_invites')
      .update({ is_revoked: true })
      .eq('id', inviteId);

    if (error) throw error;
  }
};
