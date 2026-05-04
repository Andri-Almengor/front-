import { Platform } from 'react-native';

export function installResponsiveWebStyles() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('kosher-responsive-web-styles')) return;

  const style = document.createElement('style');
  style.id = 'kosher-responsive-web-styles';
  style.textContent = `
    html, body, #root { width: 100%; min-height: 100%; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
    body { overflow-x: hidden; background: #f8fafc; }
    body, button, input, textarea, select { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    a, button, [role='button'] { cursor: pointer; }
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.22); border-radius: 999px; }
    ::-webkit-scrollbar-track { background: transparent; }
    #root { display: flex; flex-direction: column; }
    * { box-sizing: border-box; }
    img, video, canvas, svg { max-width: 100%; height: auto; }
    input, textarea, select, button { font: inherit; }
    @media (max-width: 768px) {
      body { touch-action: manipulation; }
      [role='button'] { cursor: pointer; }
    }
    @media (min-width: 1024px) {
      #root { min-height: 100vh; }
    }
  `;
  document.head.appendChild(style);
}
