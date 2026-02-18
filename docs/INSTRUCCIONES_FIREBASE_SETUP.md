# Instrucciones de Configuración - Firebase Analytics

## 📋 Variables de Entorno

Necesitas agregar las siguientes variables a tu archivo `.env.local` (crear si no existe):

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyBqBu6AvpNcx3QRDonGQPWN8dkd-i0GlY4"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ecowater---d.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="ecowater---d"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="ecowater---d.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1069059447727"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1069059447727:web:d576ee4a087478ee1eed5a"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-G6MTMZSSTN"
```

## ✅ Pasos para Completar la Configuración

1. **Crear archivo `.env.local`** en la raíz del proyecto (si no existe)
2. **Agregar las variables** de arriba al archivo
3. **Reiniciar el servidor de desarrollo** (`npm run dev`)
4. **Verificar** que no haya errores en la consola

## 🧪 Verificación

Una vez configurado, puedes verificar que Firebase Analytics está funcionando:

1. Abre la consola del navegador (F12)
2. En desarrollo, verás logs como `[Analytics] Event: ...` cuando se disparen eventos
3. En producción, los eventos se enviarán a Firebase Analytics

## 📝 Notas Importantes

- Las variables deben empezar con `NEXT_PUBLIC_` para estar disponibles en el cliente
- El archivo `.env.local` está en `.gitignore` y no se subirá al repositorio
- Después de agregar las variables, **reinicia el servidor** para que se carguen

## 🚀 Próximos Pasos

Una vez configurado, puedes empezar a usar el hook `useAnalytics()` en tus componentes:

```tsx
import { useAnalytics } from "@/hooks/use-analytics";

function MyComponent() {
  const { logEvent } = useAnalytics();

  const handleClick = () => {
    logEvent("button_click", { button_name: "submit" });
  };

  return <button onClick={handleClick}>Click me</button>;
}
```
