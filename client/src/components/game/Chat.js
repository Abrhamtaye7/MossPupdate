import React, { useEffect, useRef, useState } from 'react';

const EMOJIS = ['😀', '😅', '😂', '😎', '🔥', '❤️', '🎉', '♠️', '♥️', '♦️', '♣️'];
const PROFANITY = ['damn', 'shit', 'fuck'];

const sanitizeMessage = (text) => {
  let sanitized = text;
  PROFANITY.forEach((word) => {
    const regex = new RegExp(word, 'gi');
    sanitized = sanitized.replace(regex, '***');
  });
  return sanitized;
};

const Chat = ({ messages, onSend }) => {
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(sanitizeMessage(trimmed));
    setInput('');
  };

  return (
    <div className="absolute right-4 top-24 z-40 w-64 rounded-xl border border-emerald-500/30 bg-slate-900/90 p-3 text-xs text-slate-100 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
          Table Chat
        </span>
        <button
          className="text-lg"
          onClick={() => setShowEmojis((prev) => !prev)}
          aria-label="Toggle emoji picker"
        >
          🙂
        </button>
      </div>
      {showEmojis && (
        <div className="mb-2 flex flex-wrap gap-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="rounded bg-slate-800 px-1 py-0.5 text-sm"
              onClick={() => setInput((prev) => `${prev}${emoji}`)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <div className="mb-2 h-40 overflow-y-auto rounded-lg bg-slate-950/50 p-2">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-1">
            <span
              className={
                msg.type === 'dealer'
                  ? 'text-yellow-300'
                  : msg.type === 'system'
                    ? 'text-slate-400'
                    : 'text-emerald-300'
              }
            >
              {msg.from ? `${msg.from}: ` : ''}
            </span>
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center gap-2">
        <input
          className="w-full rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-400"
          placeholder="Type a message..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSend()}
        />
        <button
          className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-slate-900"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
