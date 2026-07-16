// mesh/NearbyUsers.js
//
// This is the JS-side wrapper around your native Kotlin Bluetooth module
// (NearbyModule.kt). Everything here is "finding users" and "sending raw
// data" — no internet, no server, just direct radio communication.
//
// FALLBACK: If NearbyModule is not present (running in Expo Go or Web),
// it runs a high-fidelity simulator that triggers mock peer discovery
// and automated messaging, letting you test the radar, network map, and
// chat features directly!

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
  console.log('[MeshLink P2P] NearbyModule is null. Launching simulated mode for Expo Go / Simulator.');
}

// Simulated active listeners array
const simulatedListeners = {
  onPeerConnected: [],
  onPeerDisconnected: [],
  onPayloadReceived: []
};

// Simulated nodes repository
const MOCK_PEERS = [
  { endpointId: 'sim-sarah', displayName: 'Sarah Chen', delay: 4000 },
  { endpointId: 'sim-marcus', displayName: 'Marcus Thorne', delay: 8000 },
  { endpointId: 'sim-elena', displayName: 'Elena Rodriguez', delay: 12000 }
];

let simulatorIntervals = [];

// ---------- FINDING USERS (discovery) ----------

export function startMeshNode(displayName) {
  if (!NearbyModule) {
    console.warn('[MeshLink P2P] Native module missing. Running P2P discovery in SIMULATOR mode.');
    
    // Simulate discovering mock nodes sequentially
    MOCK_PEERS.forEach((peer) => {
      const timeout = setTimeout(() => {
        // Trigger simulated peer discovery connection
        simulatedListeners.onPeerConnected.forEach(cb => {
          cb({ endpointId: peer.endpointId, displayName: peer.displayName });
        });

        // Periodically send mock payloads from discovered peers
        const msgInterval = setInterval(() => {
          const mockMessages = [
            `Hi! I am testing the local mesh node on this channel. Are you receiving?`,
            `Standing by as a relay bridge in your sector.`,
            `Mesh pulse looks steady on my monitor.`,
            `Signal is strong. Re-routed packet through local relay.`
          ];
          const randomMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)];
          
          simulatedListeners.onPayloadReceived.forEach(cb => {
            cb({
              endpointId: peer.endpointId,
              payload: JSON.stringify({ text: randomMsg })
            });
          });
        }, 15000 + Math.random() * 10000);

        simulatorIntervals.push(msgInterval);

      }, peer.delay);

      simulatorIntervals.push(timeout);
    });

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
  if (!NearbyModule) {
    // Clear all simulation loops
    simulatorIntervals.forEach(item => {
      clearTimeout(item);
      clearInterval(item);
    });
    simulatorIntervals = [];
    return;
  }
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
    console.log(`[MeshLink P2P Sim] Sent payload to ${endpointId}:`, messageObject);
    
    // Simulate automated replies from the simulator
    if (endpointId.startsWith('sim-')) {
      setTimeout(() => {
        const replies = [
          "Copy that. I'm receiving your mesh packets clearly.",
          "Acknowledged. Routing signal through nearby node.",
          "Confirmed. Mesh pulse is steady.",
          "Received! System logs updated offline."
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        simulatedListeners.onPayloadReceived.forEach(cb => {
          cb({
            endpointId,
            payload: JSON.stringify({ text: randomReply })
          });
        });
      }, 2000);
    }
    return;
  }
  try {
    NearbyModule.sendPayload(endpointId, JSON.stringify(messageObject));
  } catch (e) {
    console.error('[MeshLink P2P] Failed to send payload to peer:', e);
  }
}

// ---------- LISTENING FOR EVENTS ----------

export function onPeerConnected(callback) {
  if (!nearbyEvents) {
    simulatedListeners.onPeerConnected.push(callback);
    return {
      remove: () => {
        simulatedListeners.onPeerConnected = simulatedListeners.onPeerConnected.filter(cb => cb !== callback);
      }
    };
  }
  return nearbyEvents.addListener('onPeerConnected', callback);
}

// Fires when a previously connected phone goes out of range
export function onPeerDisconnected(callback) {
  if (!nearbyEvents) {
    simulatedListeners.onPeerDisconnected.push(callback);
    return {
      remove: () => {
        simulatedListeners.onPeerDisconnected = simulatedListeners.onPeerDisconnected.filter(cb => cb !== callback);
      }
    };
  }
  return nearbyEvents.addListener('onPeerDisconnected', callback);
}

// Fires whenever ANY data arrives from a connected peer
export function onPayloadReceived(callback) {
  if (!nearbyEvents) {
    simulatedListeners.onPayloadReceived.push(callback);
    return {
      remove: () => {
        simulatedListeners.onPayloadReceived = simulatedListeners.onPayloadReceived.filter(cb => cb !== callback);
      }
    };
  }
  return nearbyEvents.addListener('onPayloadReceived', callback);
}