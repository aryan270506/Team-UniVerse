export function getPeerKey(peer) {
  return peer?.deviceId || peer?.endpointId || peer?.id || peer?.displayName || peer?.name || 'unknown-peer';
}

export function normalizePeer(peer = {}) {
  const peerKey = getPeerKey(peer);
  const displayName = peer.displayName || peer.name || peer.deviceName || 'Nearby Device';

  return {
    id: peerKey,
    peerKey,
    deviceId: peer.deviceId || peerKey,
    endpointId: peer.endpointId || peer.deviceId || peerKey,
    displayName,
    name: displayName,
    status: peer.status || (peer.connected ? 'Connected' : 'Nearby'),
    connectionState: peer.connectionState || (peer.connected ? 'connected' : 'discovered'),
    connected: !!peer.connected,
    added: peer.added ?? false,
    avatarStatusColor: peer.avatarStatusColor || (peer.connected ? '#10b981' : '#fbbf24'),
    lastSeen: peer.lastSeen || Date.now(),
    level: peer.level || 'STRONG',
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
  });
}
