
import * as React from 'react';
import { useState } from 'react';
import { Group, User } from '../types';
import { Plus, Settings, Volume2, User as UserIcon, X, Check, Briefcase, LogOut, Search } from 'lucide-react';

interface SidebarProps {
  groups: Group[];
  activeGroupId: string;
  onSelectGroup: (id: string) => void;
  currentUser: User;
  onOpenProfile: () => void;
  onCreateGroup: (name: string, isPrivate: boolean, type: 'social' | 'work') => void;
  onOpenJoinModal: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  groups, 
  activeGroupId, 
  onSelectGroup, 
  currentUser,
  onOpenProfile,
  onCreateGroup,
  onOpenJoinModal,
  onLogout
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [groupType, setGroupType] = useState<'social' | 'work'>('social');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName, isPrivate, groupType);
      setNewGroupName('');
      setGroupType('social');
      setIsCreating(false);
    }
  };

  return (
    <div className="w-20 md:w-64 flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300">
      {/* App Logo/Header */}
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-800 shrink-0">
        <div className="w-8 h-8 bg-nexus-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          N
        </div>
        <span className="hidden md:block ml-3 font-bold text-white tracking-wide">Nexus</span>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        <div className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hidden md:block flex items-center justify-between">
          <span>Your Groups</span>
        </div>
        
        {groups.map(group => (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className={`w-full flex items-center px-3 py-2 md:px-6 transition-colors relative group
              ${activeGroupId === group.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}
          >
            {activeGroupId === group.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-nexus-500 rounded-r-full" />
            )}
            <div className="relative shrink-0">
              <img 
                src={group.icon} 
                alt={group.name} 
                className={`w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-slate-700 transition-all ${group.type === 'work' ? 'rounded-md' : 'rounded-xl'}`} 
              />
              {group.type === 'work' && (
                <div className="absolute -bottom-1 -left-1 bg-blue-500 p-0.5 rounded-full border-2 border-slate-900" title="Work Group">
                    <Briefcase size={10} className="text-white" />
                </div>
              )}
              {group.voiceActive && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 p-0.5 rounded-full border-2 border-slate-900">
                  <Volume2 size={10} className="text-white" />
                </div>
              )}
            </div>
            <div className="hidden md:flex flex-col items-start ml-3 overflow-hidden">
              <span className="font-medium truncate w-full text-left">{group.name}</span>
              <span className="text-xs text-slate-500">
                {group.isPrivate ? 'Private' : 'Public'} • {group.type === 'work' ? 'Work' : 'Social'}
              </span>
            </div>
          </button>
        ))}

        {isCreating ? (
           <form onSubmit={handleSubmit} className="px-3 md:px-6 py-2">
             <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 space-y-3">
               <input 
                 autoFocus
                 type="text"
                 placeholder="Group Name"
                 className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-sm text-white focus:border-nexus-500 outline-none"
                 value={newGroupName}
                 onChange={e => setNewGroupName(e.target.value)}
               />
               
               <div className="flex flex-col gap-2">
                 <label className="flex items-center text-xs cursor-pointer select-none">
                   <input 
                    type="checkbox" 
                    checked={isPrivate} 
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="mr-2 rounded bg-slate-700 border-slate-600 text-nexus-600"
                   />
                   Private Group
                 </label>

                 <label className="flex items-center text-xs cursor-pointer select-none">
                   <input 
                    type="checkbox" 
                    checked={groupType === 'work'} 
                    onChange={e => setGroupType(e.target.checked ? 'work' : 'social')}
                    className="mr-2 rounded bg-slate-700 border-slate-600 text-blue-500"
                   />
                   Work Environment
                 </label>
               </div>

               <div className="flex justify-end gap-1 pt-1">
                   <button type="button" onClick={() => setIsCreating(false)} className="p-1 hover:text-white"><X size={14} /></button>
                   <button type="submit" className="p-1 bg-nexus-600 text-white rounded hover:bg-nexus-500"><Check size={14} /></button>
               </div>
             </div>
           </form>
        ) : (
          <div className="px-3 md:px-4 py-2 space-y-1">
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <div className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center shrink-0 group-hover:border-slate-400">
                <Plus size={16} />
              </div>
              <span className="hidden md:block ml-3 text-sm font-medium">Create Group</span>
            </button>
            <button 
              onClick={onOpenJoinModal}
              className="w-full flex items-center px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <div className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center shrink-0">
                <Search size={16} />
              </div>
              <span className="hidden md:block ml-3 text-sm font-medium">Join Group</span>
            </button>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 shrink-0">
        <div className="flex items-center w-full p-2 rounded-lg transition-colors">
          <button 
            onClick={onOpenProfile}
            className="flex items-center flex-1 min-w-0 hover:bg-slate-800 p-1 rounded-md transition-colors"
          >
            <div className="relative shrink-0">
              <img src={currentUser.avatar} alt="User" className="w-9 h-9 rounded-full object-cover" />
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 
                ${currentUser.status === 'online' ? 'bg-green-500' : currentUser.status === 'away' ? 'bg-yellow-500' : 'bg-slate-500'}`} 
              />
            </div>
            <div className="hidden md:flex flex-col items-start ml-3 overflow-hidden">
              <span className="text-sm font-medium text-white truncate w-full text-left">{currentUser.name}</span>
              <span className="text-xs text-slate-500 capitalize">{currentUser.status}</span>
            </div>
          </button>
          
          <div className="hidden md:flex ml-auto items-center gap-1">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenProfile();
                }}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition-all"
                title="Settings"
            >
                <Settings size={16} />
            </button>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                }}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-all"
                title="Sign Out"
            >
                <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
