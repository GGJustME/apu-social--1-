import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Message, User, EventSuggestion } from '../types';
import { Send, Smile, Paperclip, Calendar, Check, X, MapPin, UserPlus } from 'lucide-react';
import { extractEventFromText } from '../services/geminiService';

interface ChatAreaProps {
  messages: Message[];
  currentUser: User;
  onSendMessage: (text: string, eventDetails?: EventSuggestion) => void;
  onAddMember: (email: string) => void;
  channelName: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  currentUser, 
  onSendMessage,
  onAddMember,
  channelName 
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');
    setIsProcessing(true);

    let eventDetails: EventSuggestion | null = null;
    
    try {
      // Optimistic extraction using AI service
      eventDetails = await extractEventFromText(textToSend);
    } catch (err) {
      console.error("Gemini extraction failed:", err);
      // Fallback: Continue without event details
    }

    onSendMessage(textToSend, eventDetails || undefined);
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberEmail.trim()) {
      onAddMember(newMemberEmail);
      setNewMemberEmail('');
      setIsAddingMember(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center px-6 justify-between bg-white/80 backdrop-blur-sm z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <span className="text-gray-400 mr-2 text-2xl">#</span>
            {channelName}
          </h2>
          <p className="text-xs text-gray-500">Group Chat • {messages.length} messages</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsAddingMember(!isAddingMember)}
            className="p-2 text-gray-500 hover:text-nexus-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <UserPlus size={18} />
            <span className="text-sm font-medium hidden sm:inline">Add Member</span>
          </button>
          
          {isAddingMember && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-in fade-in slide-in-from-top-2 z-20">
               <h3 className="text-sm font-bold text-gray-900 mb-2">Add Member</h3>
               <form onSubmit={handleAddMemberSubmit}>
                 <input 
                   autoFocus
                   type="text" 
                   placeholder="Enter email or ID"
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-nexus-500 outline-none mb-3"
                   value={newMemberEmail}
                   onChange={e => setNewMemberEmail(e.target.value)}
                 />
                 <div className="flex gap-2">
                   <button 
                    type="button" 
                    onClick={() => setIsAddingMember(false)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                   >
                     Cancel
                   </button>
                   <button 
                    type="submit"
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-nexus-600 hover:bg-nexus-700 rounded-lg"
                   >
                     Invite
                   </button>
                 </div>
               </form>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <p>This is the start of the #{channelName} channel.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex flex-col max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                
                {/* Name & Time */}
                {!isOwn && (
                  <span className="text-xs text-gray-500 mb-1 ml-1">{msg.senderId}</span>
                )}

                {/* Bubble */}
                <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm
                  ${isOwn 
                    ? 'bg-nexus-600 text-white rounded-tr-none' 
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                  {msg.content}
                </div>

                {/* AI Event Suggestion Card */}
                {msg.isEventSuggestion && msg.eventDetails && (
                  <div className="mt-2 w-72 bg-white border border-nexus-200 rounded-xl shadow-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-nexus-50 p-3 border-b border-nexus-100 flex items-center justify-between">
                      <div className="flex items-center text-nexus-700 font-semibold text-xs uppercase tracking-wide">
                        <Calendar size={14} className="mr-1.5" />
                        Suggested Event
                      </div>
                      <span className="text-[10px] bg-nexus-200 text-nexus-800 px-1.5 py-0.5 rounded">
                        {(msg.eventDetails.confidence * 100).toFixed(0)}% Match
                      </span>
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-gray-900">{msg.eventDetails.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        {new Date(msg.eventDetails.start).toLocaleString([], { 
                          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                      {msg.eventDetails.location && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <MapPin size={12} className="mr-1" />
                          {msg.eventDetails.location}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button className="flex-1 bg-nexus-600 hover:bg-nexus-700 text-white text-xs py-1.5 rounded-lg flex items-center justify-center transition-colors">
                          <Check size={14} className="mr-1" /> Confirm
                        </button>
                        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs py-1.5 rounded-lg flex items-center justify-center transition-colors">
                          <X size={14} className="mr-1" /> Ignore
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <span className="text-[10px] text-gray-400 mt-1 mx-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-nexus-500/20 focus-within:border-nexus-500 transition-all">
          <button className="p-2 text-gray-400 hover:text-nexus-600 transition-colors">
            <Paperclip size={20} />
          </button>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isProcessing ? "AI is processing..." : "Message " + (channelName || '...')}
            disabled={isProcessing}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2 text-sm text-gray-800 placeholder-gray-400"
            rows={1}
            style={{ minHeight: '40px' }}
          />
          <button className="p-2 text-gray-400 hover:text-nexus-600 transition-colors">
            <Smile size={20} />
          </button>
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isProcessing}
            className={`p-2 rounded-xl transition-all ${
              inputText.trim() 
                ? 'bg-nexus-600 text-white shadow-md shadow-nexus-600/20 hover:bg-nexus-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
