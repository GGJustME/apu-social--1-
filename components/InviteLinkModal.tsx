import * as React from 'react';
import { useState, useEffect } from 'react';
import { X, Copy, Check, Shield, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Invite } from '../types';
import { groupService } from '../services/groupService';

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

export const InviteLinkModal: React.FC<InviteLinkModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName
}) => {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      loadInvite();
    }
  }, [isOpen, groupId]);

  const loadInvite = async () => {
    setLoading(true);
    try {
      const data = await groupService.getOrCreateInvite(groupId);
      setInvite(data);
    } catch (err) {
      console.error("Failed to load invite", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!invite) return;
    navigator.clipboard.writeText(invite.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!invite) return;
    if (!confirm("Are you sure? This will invalidate the current invite code immediately.")) return;
    
    setRevoking(true);
    try {
      await groupService.revokeInvite(invite.id);
      await loadInvite(); // Get a new one
    } catch (err) {
      alert("Failed to revoke invite");
    } finally {
      setRevoking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Invite Members</h2>
            <p className="text-sm text-slate-500">to {groupName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm font-medium">Generating invite code...</p>
            </div>
          ) : invite ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Group Invite Code</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-lg text-nexus-700 flex items-center justify-center tracking-widest shadow-inner">
                    {invite.inviteCode}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className={`px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                      ${copied ? 'bg-green-500 text-white' : 'bg-nexus-600 text-white hover:bg-nexus-700'} shadow-lg shadow-nexus-600/20`}
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 px-1">
                  Share this code with your friends. They can enter it in the "Join Group" menu to join.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                <Shield size={20} className="text-blue-500 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-blue-900">Permanent Link</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    This invite code is currently active. You can revoke it at any time to prevent new people from joining.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <AlertCircle size={14} />
                  <span className="text-[11px] font-medium">Created {new Date(invite.createdAt).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
                >
                  {revoking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Revoke Code
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-red-500 text-sm">
              Failed to generate invite.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
