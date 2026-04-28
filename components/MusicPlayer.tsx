import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Song } from '../types';
import { Play, SkipForward, SkipBack, Volume2, Music as MusicIcon, Search, ListMusic, Pause, X, Youtube, ExternalLink, ChevronDown } from 'lucide-react';
import { api } from '../services/api';

interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  queue: Song[];
  onAddToQueue: (song: Song) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ 
  currentSong: propCurrentSong, 
  isPlaying: propIsPlaying, 
  onTogglePlay, 
  queue,
  onAddToQueue 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'player' | 'search' | 'queue'>('player');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Local playback state logic (simplified for mock)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [localIsPlaying, setLocalIsPlaying] = useState(propIsPlaying);

  const currentSong = queue.length > 0 ? queue[currentTrackIndex] : null;

  useEffect(() => {
    setLocalIsPlaying(propIsPlaying);
  }, [propIsPlaying]);

  const handleToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLocalIsPlaying(!localIsPlaying);
    onTogglePlay();
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (queue.length > 0) {
      setCurrentTrackIndex((prev) => (prev + 1) % queue.length);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (queue.length > 0) {
      setCurrentTrackIndex((prev) => (prev - 1 + queue.length) % queue.length);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const results = await api.searchMusic(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddTrack = (song: Song) => {
    onAddToQueue(song);
    // If queue was empty, play this immediately
    if (queue.length === 0) {
      setCurrentTrackIndex(0);
      setLocalIsPlaying(true);
      setActiveTab('player');
    } else {
        alert("Added to queue");
    }
  };

  // --- Render: Floating Button (Collapsed State) ---
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-500">
        {/* Mini Player Bubble if song exists */}
        {currentSong && localIsPlaying && (
            <div className="hidden md:flex bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 items-center gap-3 border border-gray-100 max-w-xs">
                <img src={currentSong.cover} className="w-8 h-8 rounded-full animate-[spin_4s_linear_infinite]" />
                <div className="text-xs overflow-hidden">
                    <p className="font-bold truncate w-32">{currentSong.title}</p>
                    <p className="text-gray-500 truncate">{currentSong.artist}</p>
                </div>
            </div>
        )}

        <button 
          onClick={() => setIsOpen(true)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative overflow-hidden group
            ${localIsPlaying ? 'bg-nexus-600 ring-4 ring-nexus-200' : 'bg-white text-nexus-600'}`}
        >
          {localIsPlaying ? (
             // Visualizer bars simulation
             <div className="flex items-end gap-1 h-6">
                <div className="w-1 bg-white animate-[bounce_1s_infinite] h-3"></div>
                <div className="w-1 bg-white animate-[bounce_1.2s_infinite] h-5"></div>
                <div className="w-1 bg-white animate-[bounce_0.8s_infinite] h-2"></div>
             </div>
          ) : (
             <MusicIcon size={24} className={localIsPlaying ? 'text-white' : 'text-nexus-600'} />
          )}
        </button>
      </div>
    );
  }

  // --- Render: Expanded Widget ---
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-96 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-in zoom-in-95 fade-in duration-200 origin-bottom-right" style={{ maxHeight: '80vh', height: '600px' }}>
      
      {/* Header / Tabs */}
      <div className="bg-slate-50 border-b border-gray-200 p-2 flex items-center justify-between shrink-0">
        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
          <ChevronDown size={20} />
        </button>
        
        <div className="flex bg-gray-200 rounded-lg p-1">
            <button 
                onClick={() => setActiveTab('search')} 
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'search' ? 'bg-white shadow-sm text-nexus-600' : 'text-gray-500'}`}
            >
                Search
            </button>
            <button 
                onClick={() => setActiveTab('player')} 
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'player' ? 'bg-white shadow-sm text-nexus-600' : 'text-gray-500'}`}
            >
                Player
            </button>
            <button 
                onClick={() => setActiveTab('queue')} 
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'queue' ? 'bg-white shadow-sm text-nexus-600' : 'text-gray-500'}`}
            >
                Queue
            </button>
        </div>

        <div className="w-9"></div> {/* Spacer for alignment */}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto relative bg-white">
        
        {/* --- TAB: PLAYER --- */}
        {activeTab === 'player' && (
            <div className="h-full flex flex-col p-6">
                {currentSong ? (
                    <>
                        {/* Mock Video Player */}
                        <div className="aspect-video bg-black rounded-xl mb-6 relative overflow-hidden group shadow-lg">
                            <img src={currentSong.cover} className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Youtube size={48} className="text-white opacity-80" />
                            </div>
                            <div className="absolute bottom-2 right-2 flex gap-1">
                                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">LIVE</span>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{currentSong.title}</h3>
                            <p className="text-nexus-600 font-medium">{currentSong.artist}</p>

                            {/* Progress Bar */}
                            <div className="mt-6 mb-2 h-1.5 bg-gray-100 rounded-full w-full overflow-hidden">
                                <div className={`h-full bg-nexus-500 ${localIsPlaying ? 'w-1/2' : 'w-1/3'}`}></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 font-mono mb-6">
                                <span>1:23</span>
                                <span>{(currentSong.duration / 60).toFixed(0)}:{(currentSong.duration % 60).toString().padStart(2,'0')}</span>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between px-4">
                                <button onClick={handlePrev} className="p-2 text-gray-400 hover:text-gray-800 transition-colors">
                                    <SkipBack size={28} className="fill-current" />
                                </button>
                                <button 
                                    onClick={handleToggle}
                                    className="w-16 h-16 bg-nexus-600 hover:bg-nexus-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-nexus-600/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    {localIsPlaying ? <Pause size={32} className="fill-current" /> : <Play size={32} className="fill-current ml-1" />}
                                </button>
                                <button onClick={handleNext} className="p-2 text-gray-400 hover:text-gray-800 transition-colors">
                                    <SkipForward size={28} className="fill-current" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                        <MusicIcon size={48} className="mb-4 text-gray-200" />
                        <p>No music playing</p>
                        <button onClick={() => setActiveTab('search')} className="mt-4 text-nexus-600 font-medium text-sm hover:underline">
                            Search for songs
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* --- TAB: SEARCH --- */}
        {activeTab === 'search' && (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <form onSubmit={handleSearch} className="relative">
                        <input 
                            type="text" 
                            placeholder="Search YouTube Music..." 
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-nexus-500/20 focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isSearching ? (
                        <div className="text-center py-8 text-gray-400 text-sm">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map(result => (
                            <div key={result.id} className="flex gap-3 items-start group hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors cursor-pointer" onClick={() => handleAddTrack(result)}>
                                <div className="relative w-24 aspect-video bg-gray-200 rounded-md overflow-hidden shrink-0">
                                    <img src={result.cover} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <Play size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">{result.title}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Youtube size={12} className="text-red-600" />
                                        <p className="text-xs text-gray-500 truncate">{result.artist}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            <Youtube size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Search for your favorite tracks</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- TAB: QUEUE --- */}
        {activeTab === 'queue' && (
            <div className="p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Up Next</h3>
                {queue.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Queue is empty</p>
                ) : (
                    <div className="space-y-1">
                        {queue.map((song, idx) => (
                            <div 
                                key={song.id} 
                                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${idx === currentTrackIndex ? 'bg-nexus-50 border border-nexus-100' : 'hover:bg-gray-50'}`}
                                onClick={() => {
                                    setCurrentTrackIndex(idx);
                                    setActiveTab('player');
                                    setLocalIsPlaying(true);
                                }}
                            >
                                <div className="w-6 text-center text-xs font-medium text-gray-400">
                                    {idx === currentTrackIndex ? (
                                        <div className="flex items-end justify-center gap-0.5 h-3">
                                            <div className="w-0.5 bg-nexus-600 animate-[bounce_1s_infinite] h-2"></div>
                                            <div className="w-0.5 bg-nexus-600 animate-[bounce_1.2s_infinite] h-3"></div>
                                            <div className="w-0.5 bg-nexus-600 animate-[bounce_0.8s_infinite] h-1"></div>
                                        </div>
                                    ) : (
                                        idx + 1
                                    )}
                                </div>
                                <img src={song.cover} className="w-10 h-10 rounded-md object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${idx === currentTrackIndex ? 'text-nexus-700' : 'text-gray-900'}`}>{song.title}</p>
                                    <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Footer / Mini Control inside Widget */}
      {currentSong && activeTab !== 'player' && (
          <div className="bg-white border-t border-gray-100 p-3 flex items-center justify-between shrink-0 cursor-pointer hover:bg-gray-50" onClick={() => setActiveTab('player')}>
             <div className="flex items-center gap-3 overflow-hidden">
                <img src={currentSong.cover} className="w-10 h-10 rounded-md object-cover" />
                <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{currentSong.title}</p>
                    <p className="text-xs text-gray-500 truncate">{currentSong.artist}</p>
                </div>
             </div>
             <button onClick={handleToggle} className="p-2 text-nexus-600 hover:bg-nexus-50 rounded-full">
                {localIsPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current" />}
             </button>
          </div>
      )}
    </div>
  );
};