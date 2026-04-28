import * as React from 'react';
import { useState, useEffect } from 'react';
import { User } from '../types';
import { X, Bell, Moon, Shield, Volume2, Edit2, Save, Camera } from 'lucide-react';
import { api } from '../services/api';

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user: initialUser, isOpen, onClose }) => {
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editBio, setEditBio] = useState(user.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when prop updates
  useEffect(() => {
    setUser(initialUser);
    setEditName(initialUser.name);
    setEditBio(initialUser.bio || '');
  }, [initialUser, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const updatedUser = await api.updateUserProfile(user.id, {
            name: editName,
            bio: editBio
        });
        setUser(updatedUser);
        setIsEditing(false);
    } catch (e) {
        console.error("Failed to save profile", e);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Header / Cover Image */}
        <div className="h-40 bg-gradient-to-br from-nexus-600 via-purple-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute top-0 right-0 p-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white bg-black/20 hover:bg-black/30 p-2 rounded-full backdrop-blur-md transition-all z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-8 relative">
            {/* Avatar Row */}
            <div className="flex justify-between items-end -mt-16 mb-6">
                <div className="relative group">
                    <img 
                        src={user.avatar} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-[2rem] border-[6px] border-white shadow-xl object-cover bg-white" 
                    />
                    {isEditing && (
                        <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center cursor-pointer border-[6px] border-transparent">
                            <Camera className="text-white opacity-80" size={28} />
                        </div>
                    )}
                </div>
                
                {!isEditing ? (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="mb-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                    >
                        <Edit2 size={16} /> Edit Profile
                    </button>
                ) : (
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="mb-2 px-4 py-2 bg-nexus-600 hover:bg-nexus-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-nexus-600/30"
                    >
                        <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>

            <div className="pb-8 space-y-6">
                
                {/* User Info */}
                <div>
                    {isEditing ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                             <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Display Name</label>
                                <input 
                                    type="text" 
                                    className="w-full text-2xl font-bold text-slate-900 border-b-2 border-slate-200 focus:border-nexus-500 outline-none bg-transparent py-1 transition-colors"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                             </div>
                             <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bio</label>
                                <textarea 
                                    rows={2}
                                    className="w-full text-sm text-slate-600 border border-slate-200 rounded-xl p-3 focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500 outline-none mt-1 resize-none bg-slate-50"
                                    value={editBio}
                                    onChange={(e) => setEditBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                />
                             </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">{user.name}</h2>
                            <p className="text-nexus-600 font-medium text-sm mb-3">@{user.id}</p>
                            
                            {user.bio ? (
                                <p className="text-slate-600 leading-relaxed text-sm">{user.bio}</p>
                            ) : (
                                <p className="text-slate-400 italic text-sm">No bio yet.</p>
                            )}

                            <div className="flex gap-2 mt-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                    ${user.status === 'online' ? 'bg-green-50 text-green-700 border-green-200' 
                                    : user.status === 'away' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                                    : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                                        ${user.status === 'online' ? 'bg-green-500' : user.status === 'away' ? 'bg-yellow-500' : 'bg-slate-400'}`} 
                                    />
                                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-px bg-slate-100 w-full" />

                {/* Settings */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white text-nexus-600 rounded-xl shadow-sm border border-slate-100 group-hover:border-nexus-200 group-hover:text-nexus-700 transition-all">
                                <Volume2 size={20} />
                            </div>
                            <div>
                                <span className="font-semibold text-slate-900 block text-sm">Notification Sound</span>
                                <span className="text-xs text-slate-500">Currently: {user.notificationSound}</span>
                            </div>
                        </div>
                        <span className="text-nexus-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Change</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                            <Moon className="text-slate-400 mb-2" size={24} />
                            <span className="text-sm font-semibold text-slate-700">Dark Mode</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                             <Shield className="text-slate-400 mb-2" size={24} />
                             <span className="text-sm font-semibold text-slate-700">Privacy</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};