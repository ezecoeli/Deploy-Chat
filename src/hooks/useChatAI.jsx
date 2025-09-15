import { useState, useCallback } from 'react';

export function useChatAI(user) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState('');
  const [cache, setCache] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('chatAI_cache') || '{}');
    } catch { return {}; }
  });

  const askAI = useCallback(async (message, conversationId) => {
    setError('');
    setResponse('');
    if (!user) {
      setError('Debes iniciar sesión para usar la IA.');
      return;
    }
    if (cache[message]) {
      setResponse(cache[message]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('https://lcytdaptbiyaovbtnzog.functions.supabase.co/chat-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId }),
      });
      const data = await res.json();
      if (data.success && data.response) {
        setResponse(data.response);
        const newCache = { ...cache, [message]: data.response };
        setCache(newCache);
        localStorage.setItem('chatAI_cache', JSON.stringify(newCache));
        localStorage.setItem('chatAI_last', JSON.stringify({ message, response: data.response }));
      } else {
        setError(data.response || 'Error desconocido');
      }
    } catch (err) {
      setError('Error de red o función no disponible.');
    }
    setLoading(false);
  }, [user, cache]);

  return { loading, error, response, askAI };
}