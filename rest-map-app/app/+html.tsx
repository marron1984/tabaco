import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Custom HTML document for web builds.
 * This ensures proper height for React Native Web components.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ja" style={{ height: '100%' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="description" content="RestMap - 大阪の喫煙所・トイレ・カフェを探す" />
        <title>RestMap</title>

        {/* Global styles to fix height issues on web */}
        <style dangerouslySetInnerHTML={{ __html: `
          html, body {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          #root {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            min-height: 100vh;
            overflow: hidden;
          }

          /* Prevent text selection on mobile */
          * {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
          }

          /* Reset default styles */
          *, *::before, *::after {
            box-sizing: border-box;
          }

          /* Ensure flex containers work properly */
          [data-rnw-root] {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            min-height: 100vh;
          }
        `}} />

        {/* Disable scroll bounce on iOS web */}
        <ScrollViewStyleReset />
      </head>
      <body style={{ height: '100%', width: '100%', margin: 0, padding: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
