import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import { Send, MessageSquare, Bot, User, CheckCheck } from 'lucide-react';

export const AgentCommunicationView: React.FC = () => {
  const { messages, agents, sendMessage, selectedAgent } = useOffice();
  const [inputText, setInputText] = useState<string>('');
  const [targetReceiver, setTargetReceiver] = useState<string>('all');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText, targetReceiver);
    setInputText('');
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#09090F] font-mono text-xs select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#9E172C]/40 bg-[#0E0C16] px-2.5 py-1.5 shrink-0 gap-1">
        <div className="flex items-center space-x-1.5 min-w-0">
          <MessageSquare className="w-3.5 h-3.5 text-[#D7263D] shrink-0" />
          <span className="font-semibold text-[#E8E4E9] text-[10.5px] truncate">
            COMMUNICATION
          </span>
        </div>

        <select
          value={targetReceiver}
          onChange={e => setTargetReceiver(e.target.value)}
          className="bg-[#14121C] border border-[#9E172C]/40 rounded px-1.5 py-0.5 text-[10px] text-[#E8E4E9] focus:outline-none focus:border-[#D7263D] max-w-[125px] truncate shrink-0"
        >
          <option value="all">Broadcast Council</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.role})
            </option>
          ))}
        </select>
      </div>

      {/* Messages Stream matching screenshot */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.map(msg => {
          const isUser = msg.senderId === 'user_high_priest';
          const senderAgent = agents.find(a => a.id === msg.senderId);

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${
                isUser ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 border ${
                  isUser
                    ? 'bg-[#490D1B] border-[#D7263D] text-[#E8E4E9]'
                    : 'bg-[#14121C] border-[#9E172C]/60 text-[#39C5CF]'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[78%] rounded-md p-2 text-[11px] leading-relaxed border ${
                  isUser
                    ? 'bg-[#490D1B]/40 border-[#9E172C] text-[#E8E4E9]'
                    : 'bg-[#14121C] border-[#9E172C]/30 text-[#E8E4E9]'
                }`}
              >
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <span className="font-bold text-[#D7263D] font-cinzel text-[10px]">
                    {msg.senderName}
                  </span>
                  <span className="text-[9px] text-[#7A7280] font-mono">{msg.timestamp}</span>
                </div>
                <p className="text-[#E8E4E9] font-sans">{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="border-t border-[#9E172C]/40 bg-[#0E0C16] p-2 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Kirim pesan atau instruksi ritual ke agent..."
          className="flex-1 bg-[#14121C] border border-[#9E172C]/40 rounded px-3 py-1.5 text-xs text-[#E8E4E9] placeholder-[#7A7280] focus:outline-none focus:border-[#D7263D] font-sans"
        />
        <button
          type="submit"
          className="p-1.5 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] transition-all shadow-[0_0_8px_rgba(215,38,61,0.4)]"
          title="Send Decree"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
