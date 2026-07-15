// mesh/peers.js
//
// Keeps track of which peers (nearby phones) this device currently knows
// about — both "connected right now" and "seen before, currently offline."
// Combines an in-memory list (for instant UI updates) with the SQLite
// table (so peers are remembered even after closing the app).

import { upsertPeer, setPeerConnected, getAllPeers } from '../storage/db';

// Maps endpointId (temporary radio connection ID) -> peer info.
// endpointId changes each session; deviceId (from identity.js) stays
// permanent, which is why we track both.
const connectedEndpoints = new Map();

// Call this when NearbyBridge reports a new connection (onPeerConnected)
export function addConnectedPeer(endpointId, tempDisplayName) {
  const peer = {
    deviceId: endpointId, // until the peer's real deviceId is exchanged,
                            // fall back to endpointId as a placeholder
    displayName: tempDisplayName || 'Nearby Device',
    endpointId,
    lastSeen: Date.now(),
    connected: true,
  };
  connectedEndpoints.set(endpointId, peer);
  upsertPeer(peer);
  return peer;
}

// Call this when NearbyBridge reports a disconnect (onPeerDisconnected)
export function removeConnectedPeer(endpointId) {
  const peer = connectedEndpoints.get(endpointId);
  if (peer) {
    setPeerConnected(peer.deviceId, false);
  }
  connectedEndpoints.delete(endpointId);
}

// All peers currently in direct Bluetooth/Wi-Fi range and connected
export function getConnectedPeers() {
  return Array.from(connectedEndpoints.values());
}

// All peers ever seen (connected now OR previously), read from local DB —
// use this to populate your Peer List screen, including offline/"last seen"
export function getKnownPeers() {
  return getAllPeers();
}