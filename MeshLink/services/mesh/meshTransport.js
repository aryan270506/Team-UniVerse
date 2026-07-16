import {
  startMeshNode,
  stopMeshNode,
  requestPeerConnection,
  acceptPeerConnection,
  rejectPeerConnection,
  disconnectPeer,
  sendToPeer,
  onPeerDiscovered,
  onConnectionRequest,
  onPeerConnected,
  onPeerDisconnected,
  onConnectionRejected,
  onPayloadReceived,
  onTransportStatus,
  onTransportError,
} from '../../Helper/NearbyBridge';

export function startTransport(displayName) {
  startMeshNode(displayName);
}

export function stopTransport() {
  stopMeshNode();
}

export function requestConnection(endpointId, displayName) {
  requestPeerConnection(endpointId, displayName);
}

export function acceptConnection(endpointId) {
  acceptPeerConnection(endpointId);
}

export function rejectConnection(endpointId) {
  rejectPeerConnection(endpointId);
}

export function disconnectConnection(endpointId) {
  disconnectPeer(endpointId);
}

export function sendMessage(endpointId, messageEnvelope) {
  sendToPeer(endpointId, messageEnvelope);
}

export {
  onPeerDiscovered,
  onConnectionRequest,
  onPeerConnected,
  onPeerDisconnected,
  onConnectionRejected,
  onPayloadReceived,
  onTransportStatus,
  onTransportError,
};
