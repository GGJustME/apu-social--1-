
import * as React from 'react';
import { useState, useEffect } from 'react';
import { User } from '../types';
import { X, Shield, Check, Ban, RefreshCcw, Loader2, Search, Filter, Info } from 'lucide-react';
import { api } from '../services/api';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterStatus = 'all' | 'pending' | 'active' | 'suspended';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = filter === 'all' 
        ? await api.getUsers() 
        : await api.getUsersByStatus(filter);
      setUsers(data);
    } catch (err: any) {
      console.error("Failed to fetch users", err);
      setError("Failed to load user list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, filter]);

  if (!isOpen) return null;

  const handleAction = async (userId: string, action: 'approve' | 'suspend' | 'reactivate') => {
    setActionLoading(userId);
    setError(null);
    try {
      if (action === 'approve') await api.approveUser(userId);
      else if (action === 'suspend') await api.suspendUser(userId);
      else if (action === 'reactivate') await api.reactivateUser(userId);
      
      await fetchUsers();
    } catch (err: any) {
      console.error(`Failed to ${action} user`, err);
      setError(err.message || `Failed to ${action} user.`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-nexus-100 text-nexus-600 rounded-xl">
                <Shield size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900">Admin Control Panel</h2>
                <p className="text-sm text-slate-500 font-medium">Manage user access and approvals</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
            <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                {(['all', 'pending', 'active', 'suspended'] as FilterStatus[]).map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${filter === s ? 'bg-white text-nexus-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {s}
                    </button>
                ))}
            </div>
            <div className="relative w-full md:w-64">
                <input 
                    type="text"
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-nexus-500/20 rounded-xl text-sm transition-all outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                    <Info size={18} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="font-medium">Loading users...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-[2rem]">
                    <Search size={48} className="mb-2 opacity-20" />
                    <p className="font-medium">No users found matching your criteria</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="bg-white border border-slate-100 p-4 rounded-[1.5rem] flex items-center justify-between hover:shadow-md transition-shadow group">
                            <div className="flex items-center gap-4">
                                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-2xl object-cover bg-slate-100" />
                                <div>
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                        {user.name}
                                        {user.role === 'admin' && (
                                            <span className="px-2 py-0.5 bg-nexus-50 text-nexus-600 text-[10px] rounded-full uppercase tracking-wider border border-nexus-100">Admin</span>
                                        )}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border
                                    ${user.accountStatus === 'active' ? 'bg-green-50 text-green-700 border-green-100' 
                                    : user.accountStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100'
                                    : 'bg-red-50 text-red-700 border-red-100'}`}>
                                    {user.accountStatus}
                                </span>

                                <div className="flex gap-2">
                                    {user.accountStatus === 'pending' && (
                                        <button 
                                            disabled={!!actionLoading}
                                            onClick={() => handleAction(user.id, 'approve')}
                                            className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                                            title="Approve User"
                                        >
                                            {actionLoading === user.id ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                        </button>
                                    )}
                                    {user.accountStatus === 'active' && user.role !== 'admin' && (
                                        <button 
                                            disabled={!!actionLoading}
                                            onClick={() => handleAction(user.id, 'suspend')}
                                            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                            title="Suspend User"
                                        >
                                            {actionLoading === user.id ? <Loader2 className="animate-spin" size={18} /> : <Ban size={18} />}
                                        </button>
                                    )}
                                    {user.accountStatus === 'suspended' && (
                                        <button 
                                            disabled={!!actionLoading}
                                            onClick={() => handleAction(user.id, 'reactivate')}
                                            className="p-2 bg-nexus-600 text-white rounded-xl hover:bg-nexus-700 transition-colors disabled:opacity-50"
                                            title="Reactivate User"
                                        >
                                            {actionLoading === user.id ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-nexus-50 text-nexus-700 text-center shrink-0 border-t border-nexus-100">
            <div className="flex items-center justify-center gap-2 text-xs font-bold">
                <Info size={14} />
                <span>Approved users may need to refresh their browser to continue.</span>
            </div>
        </div>
      </div>
    </div>
  );
};
