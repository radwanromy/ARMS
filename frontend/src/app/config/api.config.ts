export const isLocalhost = window.location.hostname === 'localhost';

export const API_BASE = isLocalhost ? 'http://localhost:8080' : '';

export const WS_BASE = isLocalhost
  ? 'ws://localhost:8080'
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
