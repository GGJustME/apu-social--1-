import * as React from 'react';
import { useState, useEffect } from 'react';
import { X, Search, Users, Shield, Hash, Loader2 } from 'lucide-react';
import { Group } from '../types';
import { groupService } from '../services/groupService';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinByInvite: (code: string) => Promise<void>;
  onJoinPublic: (groupId: string) => Promise<void>;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onJoinByInvite,
  onJoinPublic
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPublicGroups();
    }
  }, [isOpen]);

  const loadPublicGroups = async () => {
    setLoading(true);
    try {
      const groups = await groupService.getPublicGroups();
      setPublicGroups(groups);
    } catch (err) {
      console.error("Failed to load public groups", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoining('invite');
    try {
      await onJoinByInvite(inviteCode.trim());
      setInviteCode('');
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to join group");
    } finally {
      setJoining(null);
    }
  };

  const handleJoinPublic = async (groupId: string) => {
    setJoining(groupId);
    try {
      await onJoinPublic(groupId);
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to join group");
    } finally {
      setJoining(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Explore Groups</h2>
            <p className="text-sm text-slate-500">Find a community or join via invite code</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Invite Code Section */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 shrink-0">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Shield size={16} className="text-nexus-600" />
            Have an Invite Code?
          </h3>
          <form onSubmit={handleInviteSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                autoFocus
                type="text"
                placeholder="ABCDEF"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-nexus-500 outline-none uppercase font-mono font-bold tracking-widest"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
              />
            </div>
            <button 
              disabled={!inviteCode.trim() || joining !== null}
              className="bg-nexus-600 hover:bg-nexus-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
            >
              {joining === 'invite' ? <Loader2 size={18} className="animate-spin" /> : 'Join'}
            </button>
          </form>
        </div>

        {/* Public Groups List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            Suggested Public Groups
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm font-medium">Looking for groups...</p>
            </div>
          ) : publicGroups.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Search size={40} className="mx-auto mb-3 opacity-20" />
              <p>No public groups found.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {publicGroups.map(group => (
                <div key={group.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-nexus-200 hover:bg-nexus-50/30 transition-all group">
                  <img src={group.icon} alt={group.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{group.name}</h4>
                    <p className="text-xs text-slate-500">{group.memberCount || 0} members • {group.type}</p>
                  </div>
                  <button 
                    onClick={() => handleJoinPublic(group.id)}
                    disabled={joining !== null}
                    className="px-4 py-2 bg-slate-100 group-hover:bg-nexus-600 group-hover:text-white text-slate-600 rounded-lg text-xs font-bold transition-all"
                  >
                    {joining === group.id ? <Loader2 size={14} className="animate-spin" /> : 'Join Group'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
