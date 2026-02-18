import { logEvent, setUserProperties, setUserId } from "firebase/analytics";
import { analytics } from "./config";

/**
 * Registra un evento en Firebase Analytics
 * @param eventName - Nombre del evento
 * @param params - Parámetros adicionales del evento
 */
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
): void => {
  if (!analytics) {
    // En desarrollo, loguear el evento sin enviarlo
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Event:", eventName, params);
    }
    return;
  }

  try {
    logEvent(analytics, eventName, params);
  } catch (error) {
    console.error("Error tracking event:", error);
  }
};

/**
 * Establece propiedades del usuario
 * @param properties - Objeto con las propiedades del usuario
 */
export const setUserProps = (
  properties: Record<string, string | number | boolean>
): void => {
  if (!analytics) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] User Properties:", properties);
    }
    return;
  }

  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.error("Error setting user properties:", error);
  }
};

/**
 * Establece el ID del usuario
 * @param userId - ID del usuario
 */
export const setUser = (userId: string | null): void => {
  if (!analytics) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] User ID:", userId);
    }
    return;
  }

  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.error("Error setting user ID:", error);
  }
};

/**
 * Limpia el ID del usuario (logout)
 */
export const clearUser = (): void => {
  setUser(null);
};

