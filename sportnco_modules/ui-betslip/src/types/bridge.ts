export interface CrossTabMessenger {
  init: (bridgeUrl: string) => void;
  ping: () => void;
  postToBridge: (message: any) => void;
  onPing: (callback: () => void) => void;
  onMessage: (messageType: string, callback: (data: any) => void) => void;
  callbacks: Record<string, Array<(data: any) => void>>;
}

declare global {
  interface Window {
    CrossTabMessenger?: CrossTabMessenger;
  }
}
