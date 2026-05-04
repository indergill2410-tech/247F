import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";

export function useNavHistory() {
  const [location] = useLocation();

  const stackRef = useRef<string[]>([location]);
  const indexRef = useRef(0);
  const skipRef = useRef(false);

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const sync = useCallback(() => {
    setCanGoBack(indexRef.current > 0);
    setCanGoForward(indexRef.current < stackRef.current.length - 1);
  }, []);

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    const stack = stackRef.current.slice(0, indexRef.current + 1);
    stack.push(location);
    stackRef.current = stack;
    indexRef.current = stack.length - 1;
    sync();
  }, [location, sync]);

  const goBack = useCallback(() => {
    if (indexRef.current > 0) {
      skipRef.current = true;
      indexRef.current--;
      sync();
      window.history.back();
    }
  }, [sync]);

  const goForward = useCallback(() => {
    if (indexRef.current < stackRef.current.length - 1) {
      skipRef.current = true;
      indexRef.current++;
      sync();
      window.history.forward();
    }
  }, [sync]);

  return { canGoBack, canGoForward, goBack, goForward };
}
