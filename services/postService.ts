import { supabase } from './supabaseClient';
import { Post } from '../types';

const mapPost = (dbPost: any): Post => ({
  id: dbPost.id,
  authorId: dbPost.author_id,
  content: dbPost.content,
  image: dbPost.image_url,
  likes: 0, // Reactions not implemented yet
  comments: 0, // Comments not implemented yet
  timestamp: dbPost.created_at
});

export const postService = {
  async getPosts(groupId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapPost);
  },

  async createPost(groupId: string, authorId: string, content: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        group_id: groupId,
        author_id: authorId,
        content: content
      })
      .select()
      .single();

    if (error) throw error;
    return mapPost(data);
  },

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  }
};
