// mesh/NearbyBridge.js
//
// This is the JS-side wrapper around your native Kotlin Bluetooth module
// (NearbyModule.kt). Everything here is "finding users" and "sending raw
// data" — no internet, no server, just direct radio communication.

import { NativeModules, NativeEventEmitter } from 'react-native';

const { NearbyModule } = NativeModules;

// Create event emitter safely only if the native module is present
let nearbyEvents = null;
if (NearbyModule) {
  try {
    nearbyEvents = new NativeEventEmitter(NearbyModule);
  } catch (e) {
    console.warn('[MeshLink P2P] Failed to initialize NativeEventEmitter:', e);
  }
} else {
  console.log('[MeshLink P2P] NearbyModule is null. Running in simulator or Expo Go without native P2P capabilities.');
}

// ---------- FINDING USERS (discovery) ----------

// Starts broadcasting "I'm here" + listening for others doing the same.
// Call this once permissions are granted.
export function startMeshNode(displayName) {
  if (!NearbyModule) {
    console.warn('[MeshLink P2P] startMeshNode ignored: NearbyModule is null. Rebuild your app using EAS to use offline mesh features.');
    return;
  }
  try {
    NearbyModule.startAdvertising(displayName);
    NearbyModule.startDiscovery();
  } catch (e) {
    console.error('[MeshLink P2P] Failed to start native mesh node:', e);
  }
}

export function stopMeshNode() {
  if (!NearbyModule) return;
  try {
    NearbyModule.stopAdvertising?.();
    NearbyModule.stopDiscovery?.();
  } catch (e) {
    console.error('[MeshLink P2P] Failed to stop native mesh node:', e);
  }
}

// ---------- SENDING DATA ----------

export function sendToPeer(endpointId, messageObject) {
  if (!NearbyModule) {
    console.warn('[MeshLink P2P] sendToPeer ignored: NearbyModule is null.');
    return;
  }
  try {
    NearbyModule.sendPayload(endpointId, JSON.stringify(messageObject));
  } catch (e) {
    console.error('[MeshLink P2P] Failed to send payload to peer:', e);
  }
}

// ---------- LISTENING FOR EVENTS ----------
// Each of these returns a subscription — always store it and call
// .remove() when your screen/component unmounts (see hooks/useMesh.js)

// Fires when a nearby phone is discovered and connected to
export function onPeerConnected(callback) {
  if (!nearbyEvents) {
    return { remove: () => {} };
  }
  return nearbyEvents.addListener('onPeerConnected', callback);
}

// Fires when a previously connected phone goes out of range
export function onPeerDisconnected(callback) {
  if (!nearbyEvents) {
    return { remove: () => {} };
  }
  return nearbyEvents.addListener('onPeerDisconnected', callback);
}

// Fires whenever ANY data arrives from a connected peer
export function onPayloadReceived(callback) {
  if (!nearbyEvents) {
    return { remove: () => {} };
  }
  return nearbyEvents.addListener('onPayloadReceived', callback);
}