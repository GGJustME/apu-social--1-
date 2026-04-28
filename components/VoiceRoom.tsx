import * as React from 'react';
import { User } from '../types';
import { Mic, MicOff, Headphones, PhoneOff, Signal } from 'lucide-react';

interface VoiceRoomProps {
  participants: User[];
  onLeave: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const VoiceRoom: React.FC<VoiceRoomProps> = ({ participants, onLeave, isMuted, onToggleMute }) => {
  return (
    <div className="bg-slate-900 text-white p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Signal className="text-green-500" size={18} />
          <h3 className="font-bold text-lg">General Voice</h3>
        </div>
        <div className="bg-slate-800 px-2 py-1 rounded text-xs text-slate-400 font-mono">
          WebRTC Connected
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto content-start">
        {participants.map(p => (
          <div key={p.id} className="relative aspect-square bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 group hover:bg-slate-750 transition-colors border border-slate-700/50">
            <div className="relative">
              <img src={p.avatar} className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-700 group-hover:ring-nexus-500/50 transition-all" alt={p.name} />
              {/* Speaking Indicator */}
              <div className="absolute -inset-1 rounded-full border-2 border-green-500 animate-pulse opacity-0 group-hover:opacity-100" />
            </div>
            <span className="mt-3 font-medium text-sm">{p.name}</span>
            <div className="absolute top-2 right-2 bg-slate-900/50 p-1.5 rounded-full backdrop-blur-sm">
               <Mic size={14} className="text-white" />
            </div>
          </div>
        ))}
        
        {/* Placeholder for "Invite" */}
        <button className="aspect-square border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 transition-all">
          <span className="text-2xl font-light">+</span>
          <span className="text-xs mt-1">Invite</span>
        </button>
      </div>

      {/* Controls */}
      <div className="mt-4 bg-slate-800 rounded-2xl p-4 flex justify-center items-center gap-6">
        <button 
          onClick={onToggleMute}
          className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        
        <button 
          onClick={onLeave}
          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition-all shadow-lg shadow-red-900/20"
        >
          <PhoneOff size={24} />
        </button>
        
        <button className="p-4 rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-all">
          <Headphones size={24} />
        </button>
      </div>
    </div>
  );
};