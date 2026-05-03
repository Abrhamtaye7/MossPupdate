import React, { useState } from 'react';
import GlobalContext from './globalContext';

const GlobalState = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [id, setId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [email, setEmail] = useState(null);
  const [chipsAmount, setChipsAmount] = useState(null);
  const [tables, setTables] = useState(null);
  const [players, setPlayers] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [phone, setPhone] = useState(null);
  const [lastActive, setLastActive] = useState(null);
  const [avatars, setAvatars] = useState({});

  return (
    <GlobalContext.Provider
      value={{
        isLoading,
        setIsLoading,
        userName,
        setUserName,
        email,
        setEmail,
        chipsAmount,
        setChipsAmount,
        isPremium,
        setIsPremium,
        isAdmin,
        setIsAdmin,
        avatarUrl,
        setAvatarUrl,
        phone,
        setPhone,
        lastActive,
        setLastActive,
        avatars,
        setAvatars,
        id,
        setId,
        tables,
        setTables,
        players,
        setPlayers,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalState;
