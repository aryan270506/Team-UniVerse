import { requireNativeModule, EventEmitter } from 'expo';

let NearbyModule = null;
let nearbyEventEmitter = null;
try {
  NearbyModule = requireNativeModule('NearbyModule');
  if (NearbyModule) {
    nearbyEventEmitter = new EventEmitter(NearbyModule);
  }
} catch (e) {
  console.log('[MeshLink P2P] NearbyModule is unavailable. Using simulator mode.');
}

const simulatedListeners = {
  onPeerDiscovered: [],
  onConnectionRequest: [],
  onPeerConnected: [],
  onPeerDisconnected: [],
  onConnectionRejected: [],
  onPayloadReceived: [],
  onTransportStatus: [],
  onTransportError: [],
};

const MOCK_PEERS = [];

let simulatorTimers = [];
const simulatorConnections = new Set();

function addListener(eventName, callback) {
  if (!NearbyModule || !nearbyEventEmitter) {
    simulatedListeners[eventName].push(callback);
    return {
      remove: () => {
        simulatedListeners[eventName] = simulatedListeners[eventName].filter((cb) => cb !== callback);
      },
    };
  }

  return nearbyEventEmitter.addListener(eventName, callback);
}

function emitSimulated(eventName, payload) {
  simulatedListeners[eventName].forEach((callback) => callback(payload));
}

export function startMeshNode(displayName) {
  if (!NearbyModule) {
    console.warn('[MeshLink P2P] Native module missing. Running P2P discovery in SIMULATOR mode.');
    emitSimulated('onTransportStatus', { state: 'simulator', detail: 'Native NearbyModule unavailable' });
    return;
  }

  try {
    console.log(`[MeshLink P2P] Starting Nearby transport as "${displayName || 'MeshLink'}"`);
    NearbyModule.startAdvertising(displayName);
    NearbyModule.startDiscovery();
  } catch (e) {
    console.error('[MeshLink P2P] Failed to start native mesh node:', e);
    emitSimulated('onTransportError', { operation: 'startMeshNode', message: e.message || String(e) });
  }
}

export function stopMeshNode() {
  if (!NearbyModule) {
    simulatorTimers.forEach((timer) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    simulatorTimers = [];
    simulatorConnections.clear();
    return;
  }

  try {
    NearbyModule.stopAdvertising?.();
    NearbyModule.stopDiscovery?.();
    NearbyModule.stopAllEndpoints?.();
  } catch (e) {
    console.error('[MeshLink P2P] Failed to stop native mesh node:', e);
  }
}

export function requestPeerConnection(endpointId, displayName) {
  if (!NearbyModule) {
    const requestTimer = setTimeout(() => {
      emitSimulated('onConnectionRequest', {
        endpointId,
        displayName: displayName || 'Nearby Device',
      });
    }, 150);

    const acceptTimer = setTimeout(() => {
      simulatorConnections.add(endpointId);
      emitSimulated('onPeerConnected', {
        endpointId,
        displayName: displayName || 'Nearby Device',
      });
    }, 700);

    simulatorTimers.push(requestTimer, acceptTimer);
    return;
  }

  try {
    NearbyModule.requestPeerConnection(endpointId, displayName || 'MeshLink');
  } catch (e) {
    console.error('[MeshLink P2P] Failed to request peer connection:', e);
  }
}

export function acceptPeerConnection(endpointId) {
  if (!NearbyModule) {
    simulatorConnections.add(endpointId);
    emitSimulated('onPeerConnected', { endpointId, displayName: 'Nearby Device' });
    return;
  }

  try {
    NearbyModule.acceptPeerConnection(endpointId);
  } catch (e) {
    console.error('[MeshLink P2P] Failed to accept peer connection:', e);
  }
}

export function rejectPeerConnection(endpointId) {
  if (!NearbyModule) {
    emitSimulated('onConnectionRejected', { endpointId });
    return;
  }

  try {
    NearbyModule.rejectPeerConnection(endpointId);
  } catch (e) {
    console.error('[MeshLink P2P] Failed to reject peer connection:', e);
  }
}

export function disconnectPeer(endpointId) {
  if (!NearbyModule) {
    simulatorConnections.delete(endpointId);
    emitSimulated('onPeerDisconnected', { endpointId });
    return;
  }

  try {
    NearbyModule.disconnectPeer(endpointId);
  } catch (e) {
    console.error('[MeshLink P2P] Failed to disconnect peer:', e);
  }
}

export function sendToPeer(endpointId, messageObject) {
  if (!NearbyModule) {
    if (!simulatorConnections.has(endpointId)) {
      console.warn(`[MeshLink P2P Sim] Attempted to send to disconnected endpoint ${endpointId}`);
      return;
    }

    const echoTimer = setTimeout(() => {
      const replies = [
        'Copy that. I am receiving your mesh packets clearly.',
        'Acknowledged. Routing signal through the nearby link.',
        'Confirmed. The local connection is steady.',
        'Received offline. Mesh session looks healthy.',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      emitSimulated('onPayloadReceived', {
        endpointId,
        payload: JSON.stringify({
          id: `sim-${Date.now()}`,
          type: 'chat',
          text: randomReply,
        }),
      });
    }, 1000);

    simulatorTimers.push(echoTimer);
    return;
  }

  try {
    NearbyModule.sendPayload(endpointId, JSON.stringify(messageObject));
  } catch (e) {
    console.error('[MeshLink P2P] Failed to send payload to peer:', e);
  }
}

export function onPeerDiscovered(callback) {
  return addListener('onPeerDiscovered', callback);
}

export function onConnectionRequest(callback) {
  return addListener('onConnectionRequest', callback);
}

export function onPeerConnected(callback) {
  return addListener('onPeerConnected', callback);
}

export function onPeerDisconnected(callback) {
  return addListener('onPeerDisconnected', callback);
}

export function onConnectionRejected(callback) {
  return addListener('onConnectionRejected', callback);
}

export function onPayloadReceived(callback) {
  return addListener('onPayloadReceived', callback);
}

export function onTransportStatus(callback) {
  return addListener('onTransportStatus', callback);
}

export function onTransportError(callback) {
  return addListener('onTransportError', callback);
}

// Backward-compatible aliases used by older screens and helpers.
export const startAdvertising = startMeshNode;
export const startDiscovery = startMeshNode;
export const stopAdvertising = stopMeshNode;
export const stopDiscovery = stopMeshNode;
export const requestConnection = requestPeerConnection;
export const acceptConnection = acceptPeerConnection;
export const rejectConnection = rejectPeerConnection;
export const disconnectFromPeer = disconnectPeer;
