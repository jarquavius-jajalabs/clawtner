import { useRef, useState, useCallback } from 'react';

interface SwipeState {
  offsetX: number;
  swiping: boolean;
  direction: 'left' | 'right' | null;
}

export function useSwipe(onLeft: () => void, onRight: () => void, threshold = 120) {
  const startX = useRef(0);
  const [state, setState] = useState<SwipeState>({ offsetX: 0, swiping: false, direction: null });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setState({ offsetX: 0, swiping: true, direction: null });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startX.current;
    setState({
      offsetX: diff,
      swiping: true,
      direction: diff > 30 ? 'right' : diff < -30 ? 'left' : null,
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (state.offsetX > threshold) {
      onRight();
    } else if (state.offsetX < -threshold) {
      onLeft();
    }
    setState({ offsetX: 0, swiping: false, direction: null });
  }, [state.offsetX, threshold, onLeft, onRight]);

  return { ...state, onTouchStart, onTouchMove, onTouchEnd };
}
