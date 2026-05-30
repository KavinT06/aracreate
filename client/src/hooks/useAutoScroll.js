import { useEffect, useRef } from 'react';

export const useAutoScroll = (items) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  return bottomRef;
};
