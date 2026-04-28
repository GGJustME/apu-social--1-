import { supabase } from './supabaseClient';
import { Message, EventSuggestion } from '../types';

const mapMessage = (dbMsg: any): Message => ({
  id: dbMsg.id,
  senderId: dbMsg.sender_id,
  groupId: dbMsg.group_id,
  content: dbMsg.content,
  timestamp: dbMsg.created_at,
  type: dbMsg.type,
  eventDetails: dbMsg.event_details || undefined,
  isEventSuggestion: !!dbMsg.event_details
});

export const chatService = {
  async getMessages(groupId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapMessage);
  },

  async sendMessage(
    content: string,
    senderId: string,
    groupId: string,
    type: 'text' | 'image' | 'sticker' = 'text',
    eventDetails?: EventSuggestion
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content,
        sender_id: senderId,
        group_id: groupId,
        type,
        event_details: eventDetails || null
      })
      .select()
      .single();

    if (error) throw error;
    return mapMessage(data);
  },

  subscribeToMessages(groupId: string, onMessage: (message: Message) => void) {
    const channel = supabase
      .channel(`room:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          onMessage(mapMessage(payload.new));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
