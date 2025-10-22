/// <reference types="vite/client" />

interface CrossTabMessenger {
  init(bridgeUrl: string): CrossTabMessenger
  ping(): void
  pong(): void
  onPing(callback: () => void): void
  onPong(callback: (origin: string) => void): void
}

declare global {
  interface Window {
    CrossTabMessenger: CrossTabMessenger
  }
}
