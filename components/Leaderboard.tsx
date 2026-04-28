import * as React from 'react';
import { useState } from 'react';
import { LeaderboardData, User } from '../types';
import { Trophy, Medal, MessageSquare, Mic, Heart, Flame, Crown, Music, Quote, LayoutList, Hash } from 'lucide-react';

interface LeaderboardProps {
  data: LeaderboardData;
  users: User[];
  groupName: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ data, users, groupName }) => {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  
  const currentSection = data ? (period === 'monthly' ? data.monthly : data.annual) : null;
  const entries = currentSection ? currentSection.entries : [];
  const stats = currentSection ? currentSection.stats : null;

  // Sort entries by score just in case
  const sortedEntries = [...entries].sort((a, b) => b.score - a.score);
  const topThree = sortedEntries.slice(0, 3);
  const rest = sortedEntries.slice(3);

  const getUser = (id: string) => users.find(u => u.id === id) || { 
    name: 'Unknown', 
    avatar: 'https://via.placeholder.com/100', 
    status: 'offline' 
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header & Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="text-yellow-500" />
              Leaderboard
            </h2>
            <p className="text-gray-500 text-sm">Top contributors in {groupName}</p>
          </div>
          
          <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex">
            <button 
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'monthly' ? 'bg-nexus-100 text-nexus-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              This Month
            </button>
            <button 
              onClick={() => setPeriod('annual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'annual' ? 'bg-nexus-100 text-nexus-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Podium Section */}
        {topThree.length > 0 && (
          <div className="flex justify-center items-end gap-4 md:gap-8 mb-12 min-h-[240px]">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700 delay-100">
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-gray-300 to-gray-100 shadow-lg">
                    <img src={getUser(topThree[1].userId).avatar} className="w-full h-full rounded-full object-cover border-2 border-white" />
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <div className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full border border-white flex items-center shadow-sm">
                      2
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-800 text-sm">{getUser(topThree[1].userId).name}</p>
                  <p className="text-nexus-600 font-bold text-lg">{topThree[1].score}</p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
                <div className="h-24 w-24 bg-gradient-to-t from-gray-200/50 to-transparent rounded-t-xl mt-4" />
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-8 duration-700">
                <div className="relative mb-3">
                  <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-500 fill-yellow-500 animate-bounce" size={24} />
                  <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-yellow-200 to-yellow-500 shadow-xl ring-4 ring-yellow-100">
                    <img src={getUser(topThree[0].userId).avatar} className="w-full h-full rounded-full object-cover border-4 border-white" />
                  </div>
                  <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                     <div className="bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded-full border-2 border-white flex items-center shadow-sm">
                       1
                     </div>
                  </div>
                </div>
                <div className="text-center transform -translate-y-1">
                  <p className="font-bold text-gray-900 text-lg">{getUser(topThree[0].userId).name}</p>
                  <p className="text-nexus-600 font-bold text-2xl">{topThree[0].score}</p>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Score</p>
                </div>
                <div className="h-32 w-32 bg-gradient-to-t from-yellow-100/50 to-transparent rounded-t-xl mt-4" />
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-orange-300 to-orange-100 shadow-lg">
                    <img src={getUser(topThree[2].userId).avatar} className="w-full h-full rounded-full object-cover border-2 border-white" />
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <div className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full border border-white flex items-center shadow-sm">
                      3
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-800 text-sm">{getUser(topThree[2].userId).name}</p>
                  <p className="text-nexus-600 font-bold text-lg">{topThree[2].score}</p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
                <div className="h-20 w-24 bg-gradient-to-t from-orange-100/50 to-transparent rounded-t-xl mt-4" />
              </div>
            )}
          </div>
        )}

        {/* Group Pulse / Stats Row */}
        {stats && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Community Pulse</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-xl text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
                <Quote className="absolute -right-2 -bottom-2 text-white/20 w-16 h-16" />
                <p className="text-indigo-100 text-xs font-medium uppercase">Most Used Word</p>
                <p className="text-xl font-bold mt-1">"{stats.mostUsedWord}"</p>
              </div>

              <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-4 rounded-xl text-white shadow-lg shadow-pink-200 relative overflow-hidden">
                <Music className="absolute -right-2 -bottom-2 text-white/20 w-16 h-16" />
                <p className="text-pink-100 text-xs font-medium uppercase">Top Genre</p>
                <p className="text-xl font-bold mt-1">{stats.topGenre}</p>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-nexus-200 transition-colors">
                <div className="absolute top-0 right-0 p-3">
                  <div className="bg-green-100 p-1.5 rounded-lg text-green-600">
                    <LayoutList size={16} />
                  </div>
                </div>
                <p className="text-gray-500 text-xs font-medium uppercase">Feed Posts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalFeedPosts}</p>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-nexus-200 transition-colors">
                 <div className="absolute top-0 right-0 p-3">
                  <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                    <MessageSquare size={16} />
                  </div>
                </div>
                <p className="text-gray-500 text-xs font-medium uppercase">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMessages.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Hall of Fame Cards */}
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Member Highlights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Most Active</p>
              <p className="text-sm font-medium text-gray-900">
                {getUser(sortedEntries.reduce((prev, current) => (prev.messageCount > current.messageCount) ? prev : current, sortedEntries[0])?.userId || '').name}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Mic size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Voice Champion</p>
              <p className="text-sm font-medium text-gray-900">
                 {getUser(sortedEntries.reduce((prev, current) => (prev.voiceMinutes > current.voiceMinutes) ? prev : current, sortedEntries[0])?.userId || '').name}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-pink-50 text-pink-600 rounded-lg">
              <Heart size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Top Supporter</p>
              <p className="text-sm font-medium text-gray-900">
                 {getUser(sortedEntries.reduce((prev, current) => (prev.reactionsGiven > current.reactionsGiven) ? prev : current, sortedEntries[0])?.userId || '').name}
              </p>
            </div>
          </div>
        </div>

        {/* Full List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Full Rankings</h3>
            <span className="text-xs text-gray-500">{sortedEntries.length} members ranked</span>
          </div>
          
          <div className="divide-y divide-gray-100">
            {sortedEntries.map((entry, index) => (
              <div key={entry.userId} className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                <div className="w-8 text-center font-bold text-gray-400 text-sm">
                  {index + 1}
                </div>
                
                <div className="flex items-center gap-3 flex-1 ml-4">
                  <img src={getUser(entry.userId).avatar} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{getUser(entry.userId).name}</p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1"><MessageSquare size={10} /> {entry.messageCount}</span>
                      <span className="flex items-center gap-1"><Mic size={10} /> {entry.voiceMinutes}m</span>
                      <span className="flex items-center gap-1"><Heart size={10} /> {entry.reactionsGiven}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="block font-bold text-nexus-600">{entry.score}</span>
                  <span className="text-xs text-gray-400">pts</span>
                </div>
              </div>
            ))}
            
            {sortedEntries.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No data available for this period.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
