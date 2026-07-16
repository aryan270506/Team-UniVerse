export function getPeerKey(peer) {
  return peer?.deviceId || peer?.endpointId || peer?.id || peer?.displayName || peer?.name || 'unknown-peer';
}

export function normalizePeer(peer = {}) {
  const peerKey = getPeerKey(peer);
  const displayName = peer.displayName || peer.name || peer.deviceName || 'Nearby Device';

  const connected = !!peer.connected;
  const connectionState = peer.connectionState || (connected ? 'connected' : 'discovered');

  let status = peer.status;
  if (!status) {
    if (connected) {
      status = 'Online';
    } else if (connectionState === 'discovered') {
      status = 'Nearby • Tap to connect';
    } else {
      status = 'Offline';
    }
  }

  let avatarStatusColor = peer.avatarStatusColor;
  if (!avatarStatusColor) {
    if (connected) {
      avatarStatusColor = '#10b981'; // Green for online
    } else if (connectionState === 'discovered') {
      avatarStatusColor = '#fbbf24'; // Yellow for nearby
    } else {
      avatarStatusColor = '#6b7280'; // Gray for offline
    }
  }

  return {
    id: peerKey,
    peerKey,
    deviceId: peer.deviceId || peerKey,
    endpointId: peer.endpointId || peer.deviceId || peerKey,
    displayName,
    name: displayName,
    status,
    connectionState,
    connected,
    added: peer.added ?? false,
    avatarStatusColor,
    lastSeen: peer.lastSeen || Date.now(),
    level: peer.level || 'STRONG',
    profilePhoto: peer.profilePhoto || null,
  };
}

export function mergePeer(basePeer, nextPeer) {
  return normalizePeer({
    ...basePeer,
    ...nextPeer,
    deviceId: nextPeer.deviceId || basePeer?.deviceId,
    endpointId: nextPeer.endpointId || basePeer?.endpointId,
    displayName: nextPeer.displayName || nextPeer.name || basePeer?.displayName,
    connected: nextPeer.connected ?? basePeer?.connected,
    status: nextPeer.status || basePeer?.status,
    connectionState: nextPeer.connectionState || basePeer?.connectionState,
    profilePhoto: nextPeer.profilePhoto || basePeer?.profilePhoto || null,
  });
}
