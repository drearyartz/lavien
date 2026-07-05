import { ScrollViewStyleReset } from 'expo-router/html';

// Expo Router web icin kok HTML dokumani. RN Web'in flex:1 zincirinin tum
// viewport'u kaplayabilmesi icin html/body/#root height:100% olmali
// (frontend/src/styles/theme.css'teki ayni kuralla tutarli).
export default function Root({ children }) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: baseStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const baseStyle = `
html, body, #root { height: 100%; }
body { margin: 0; background-color: #0a0a0b; }
`;
