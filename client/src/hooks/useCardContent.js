import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const useCardContent = (cardId) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cardId) {
      fetchCardContent();
    } else {
      setContent(null);
    }
  }, [cardId]);

  const fetchCardContent = async () => {
    if (!cardId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('cards')
        .select('content')
        .eq('id', cardId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setContent(data?.content || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    content,
    loading,
    error,
    refetch: fetchCardContent
  };
};
