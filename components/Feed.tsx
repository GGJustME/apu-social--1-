import * as React from 'react';
import { useState } from 'react';
import { Post } from '../types';
import { Heart, MessageSquare, Share2, MoreHorizontal, Send } from 'lucide-react';

interface FeedProps {
  posts: Post[];
  onPost: (content: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ posts, onPost }) => {
  const [content, setContent] = useState('');

  const handlePost = () => {
    if (content.trim()) {
      onPost(content);
      setContent('');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Composer */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-nexus-100 rounded-full flex items-center justify-center text-nexus-600 font-bold flex-shrink-0">
              ?
            </div>
            <div className="flex-1">
              <input 
                type="text" 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePost()}
                placeholder="What's happening in the group?" 
                className="w-full py-2 bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
            <div className="flex gap-2 text-gray-400">
              <button className="text-xs hover:text-nexus-600 font-medium px-2 py-1 rounded hover:bg-gray-50">Image</button>
              <button className="text-xs hover:text-nexus-600 font-medium px-2 py-1 rounded hover:bg-gray-50">Poll</button>
            </div>
            <button 
              onClick={handlePost}
              disabled={!content.trim()}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${content.trim() ? 'bg-nexus-600 text-white hover:bg-nexus-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Post
            </button>
          </div>
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        )}

        {/* Posts */}
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-nexus-100 rounded-full flex items-center justify-center text-nexus-700 font-bold">
                  {post.authorId.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{post.authorId}</h4>
                  <p className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={20} />
              </button>
            </div>
            
            <div className="px-4 pb-2">
              <p className="text-gray-800 leading-relaxed">{post.content}</p>
            </div>

            {post.image && (
              <div className="mt-2">
                <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-96" />
              </div>
            )}

            <div className="p-4 flex items-center gap-6 border-t border-gray-50 mt-2">
              <button className="flex items-center gap-2 text-gray-500 hover:text-pink-500 transition-colors group">
                <Heart size={20} className="group-hover:fill-pink-500" />
                <span className="text-sm font-medium">{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-nexus-600 transition-colors">
                <MessageSquare size={20} />
                <span className="text-sm font-medium">{post.comments}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors ml-auto">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
