/**
 * Google Analytics globals installed by the `next/script` tags in `app/layout.tsx`.
 * Declared here so client code can call `window.gtag` without casting to `any`.
 */
declare global {
  interface Window {
    gtag?: (command: 'js' | 'config' | 'event', ...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export {}
