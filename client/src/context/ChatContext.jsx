import { createContext, useContext, useMemo, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [totalUnread, setTotalUnread] = useState(0);
  const value = useMemo(() => ({ totalUnread, setTotalUnread }), [totalUnread]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}