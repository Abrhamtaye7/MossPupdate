import React, { useMemo, useState } from 'react';

const hashColor = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
};

const Avatar = ({ url, username, size = 48, isOnline, hasGlow }) => {
  const [error, setError] = useState(false);
  const initials = (username || '?').slice(0, 2).toUpperCase();
  const bgColor = useMemo(() => hashColor(username || 'user'), [username]);

  return (
    <div
      className={`relative flex items-center justify-center rounded-full ${
        hasGlow ? 'shadow-felt-glow' : ''
      }`}
      style={{ width: size, height: size, backgroundColor: bgColor }}
    >
      {!url || error ? (
        <span className="text-sm font-semibold text-white">{initials}</span>
      ) : (
        <img
          src={url}
          alt={username || 'Avatar'}
          loading="lazy"
          className="h-full w-full rounded-full object-cover blur-sm transition duration-300 ease-out"
          onLoad={(event) => event.currentTarget.classList.remove('blur-sm')}
          onError={() => setError(true)}
        />
      )}
      {isOnline && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400" />
      )}
    </div>
  );
};

export default Avatar;
