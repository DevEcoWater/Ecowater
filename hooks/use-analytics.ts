"use client";

import { useCallback } from "react";
import { trackEvent, setUserProps, setUser, clearUser } from "@/lib/firebase/analytics";

/**
 * Hook personalizado para usar Firebase Analytics
 * 
 * @example
 * ```tsx
 * const { logEvent, setUserProperties, setUserId, clearUserId } = useAnalytics();
 * 
 * logEvent('button_click', { button_name: 'submit' });
 * setUserProperties({ role: 'admin' });
 * setUserId('user123');
 * ```
 */
export function useAnalytics() {
  const logEvent = useCallback(
    (eventName: string, params?: Record<string, any>) => {
      trackEvent(eventName, params);
    },
    []
  );

  const setUserProperties = useCallback(
    (properties: Record<string, string | number | boolean>) => {
      setUserProps(properties);
    },
    []
  );

  const setUserId = useCallback((userId: string | null) => {
    setUser(userId);
  }, []);

  const clearUserId = useCallback(() => {
    clearUser();
  }, []);

  return {
    logEvent,
    setUserProperties,
    setUserId,
    clearUserId,
  };
}

