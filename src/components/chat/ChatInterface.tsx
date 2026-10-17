import React, { useState, useRef, useEffect } from 'react';
import { useOffice } from '../../store/officeStore';
import { Send, Plus, X, FileText, MessageSquare } from 'lucide-react';

interface AttachmentFile {
  id: string;
  file: File;
  name: string;
  size: string;
}

export const ChatInterface: React.FC = () => {
  const { sendMessage, messages } = useOffice();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea between 28px and 96px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.max(28, Math.min(scrollHeight, 96));
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && attachments.length === 0) return;

    // Simple mention parser: detects @(name)
    const mentionRegex = /@\((\w+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(trimmedInput)) !== null) {
      mentions.push(match[1]);
    }

    let fullContent = trimmedInput;
    if (attachments.length > 0) {
      const fileNames = attachments.map((a) => a.name).join(', ');
      fullContent += ` [Attached: ${fileNames}]`;
    }

    sendMessage(fullContent, 'all', mentions);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = '28px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isCanSend = input.trim().length > 0 || attachments.length > 0;

  return (
    <div className="flex flex-col w-full h-full bg-[#0E0C16] min-h-0 select-none">
      {/* Chat Header */}
      <div className="px-3 py-1.5 border-b border-[#490D1B]/55 bg-[#09090F] flex items-center justify-between text-[#C69245] shrink-0">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#D7263D]" />
          <span className="text-[10px] font-bold tracking-wider uppercase">HERMES GLOBAL CHAT</span>
        </div>
      </div>

      {/* Message List (flex-1, min-h-0, overflow-y-auto) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 font-mono text-[10px] min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === 'user_high_priest' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-2 rounded shadow-sm ${
                msg.senderId === 'user_high_priest'
                  ? 'bg-[#490D1B]/40 border border-[#D7263D]/30 text-[#E8E4E9]'
                  : 'bg-[#14121C] border border-[#490D1B]/60 text-[#E8E4E9]'
              }`}
            >
              <div className="flex justify-between mb-0.5 opacity-70 text-[9px]">
                <span className="font-bold uppercase tracking-wider text-[#C69245]">{msg.senderName}</span>
                <span className="text-[#827B8D]">{msg.timestamp}</span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Compact Composer Container with safe area support */}
      <div 
        className="p-2.5 pb-3.5 bg-[#09090F] border-t border-[#490D1B]/60 shrink-0"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 16px))' }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.csv"
        />

        {/* Selected Attachments Preview Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1.5 max-h-20 overflow-y-auto">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center space-x-1 bg-[#14121C] border border-[#490D1B] px-1.5 py-0.5 rounded text-[9px] text-[#E8E4E9]"
              >
                <FileText className="w-3 h-3 text-[#D7263D] shrink-0" />
                <span className="truncate max-w-[90px]" title={att.name}>{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="text-[#827B8D] hover:text-[#D7263D] p-0.5 rounded transition-colors"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Compact Single-Row Composer Box */}
        <div className="flex items-center space-x-1.5 bg-[#14121C] border border-[#490D1B] rounded-lg px-2 py-1.5 focus-within:border-[#D7263D] shadow-inner">
          {/* Plus Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded text-[#A69EA9] hover:text-[#E8E4E9] hover:bg-[#490D1B]/40 transition-colors cursor-pointer shrink-0"
            title="Lampirkan File atau Foto"
            type="button"
          >
            <Plus className="w-4 h-4 text-[#D7263D]" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan ke Hermes..."
            className="flex-1 bg-transparent text-[#E8E4E9] text-[10px] placeholder-[#827B8D] outline-none resize-none leading-relaxed py-1"
            style={{ minHeight: '28px', maxHeight: '96px' }}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!isCanSend}
            className={`p-1.5 rounded-md transition-all shrink-0 ${
              isCanSend
                ? 'bg-[#D7263D] text-[#E8E4E9] hover:bg-[#b51f33] active:scale-95 shadow-[0_0_8px_rgba(215,38,61,0.4)] cursor-pointer'
                : 'bg-[#490D1B]/40 text-[#827B8D] cursor-not-allowed opacity-50'
            }`}
            title="Kirim Pesan"
            type="button"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
