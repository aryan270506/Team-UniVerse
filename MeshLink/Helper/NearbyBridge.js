// mesh/NearbyBridge.js
//
// This is the JS-side wrapper around your native Kotlin Bluetooth module
// (NearbyModule.kt). Everything here is "finding users" and "sending raw
// data" — no internet, no server, just direct radio communication.

import { NativeModules, NativeEventEmitter } from 'react-native';

const { NearbyModule } = NativeModules;
const nearbyEvents = new NativeEventEmitter(NearbyModule);

// ---------- FINDING USERS (discovery) ----------

// Starts broadcasting "I'm here" + listening for others doing the same.
// Call this once permissions are granted.
export function startMeshNode(displayName) {
  NearbyModule.startAdvertising(displayName);
  NearbyModule.startDiscovery();
}

export function stopMeshNode() {
  NearbyModule.stopAdvertising?.();
  NearbyModule.stopDiscovery?.();
}

// ---------- SENDING DATA ----------

export function sendToPeer(endpointId, messageObject) {
  NearbyModule.sendPayload(endpointId, JSON.stringify(messageObject));
}

// ---------- LISTENING FOR EVENTS ----------
// Each of these returns a subscription — always store it and call
// .remove() when your screen/component unmounts (see hooks/useMesh.js)

// Fires when a nearby phone is discovered and connected to
export function onPeerConnected(callback) {
  return nearbyEvents.addListener('onPeerConnected', callback);
}

// Fires when a previously connected phone goes out of range
export function onPeerDisconnected(callback) {
  return nearbyEvents.addListener('onPeerDisconnected', callback);
}

// Fires whenever ANY data arrives from a connected peer
export function onPayloadReceived(callback) {
  return nearbyEvents.addListener('onPayloadReceived', callback);
}