import { useState, useEffect, useCallback, useRef } from 'react';

export const useScrollToBottom = (messages = [], threshold = 100) => {
  const [showButton, setShowButton] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const wasAtBottomRef = useRef(true);
  const lastMessageCountRef = useRef(0);

  const checkScrollPosition = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom <= threshold;
    
    wasAtBottomRef.current = isNearBottom;
    setShowButton(!isNearBottom);
    
    if (isNearBottom) {
      setNewMessagesCount(0);
    }
  }, [threshold]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
    setShowButton(false);
    setNewMessagesCount(0);
  }, []);

  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const newMessagesAdded = messages.length - lastMessageCountRef.current;
      
      if (wasAtBottomRef.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      } else {
        setNewMessagesCount(prev => prev + newMessagesAdded);
      }
    }
    
    lastMessageCountRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkScrollPosition();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    checkScrollPosition();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [checkScrollPosition]);

  return {
    containerRef,
    messagesEndRef,
    showButton,
    newMessagesCount,
    scrollToBottom
  };
};