export const environment = {
  production: true,
  // Empty => derive the WebSocket URL from the current origin (same host as
  // the served app), so wss:// works automatically behind Cloud Run's HTTPS.
  wsUrl: ''
};
