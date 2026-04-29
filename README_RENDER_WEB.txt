Configuración para Render Static Site

Build Command:
npm install && npx expo export --platform web

Publish Directory:
dist

Backend configurado por defecto:
https://app-kosher-costa-rica.onrender.com/api

Notas:
- Esta versión web no usa expo-sqlite para evitar el error de wa-sqlite.wasm en Render.
- El almacenamiento offline web usa AsyncStorage/browser storage.
- Si antes probaste con otra IP en el navegador, limpia localStorage o usa una ventana privada.
