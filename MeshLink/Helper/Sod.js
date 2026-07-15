// mesh/sos.js
//
// SOS reuses the exact same sending/relay logic as normal chat — the only
// differences are: recipientId is always 'BROADCAST', and it starts with
// a higher TTL so it travels further across the mesh before stopping.

import * as Crypto from 'expo-crypto';
import { sendToPeer } from './NearbyBridge';
import { getConnectedPeers } from './peers';
import { saveMessage, markMessageSeen } from '../storage/db';

const SOS_TTL = 10; // higher than normal chat (5), so it spreads further

export function sendSOS({ myDeviceId, myDisplayName, text, location }) {
  const msg = {
    id: Crypto.randomUUID(),
    senderId: myDeviceId,
    senderName: myDisplayName,
    recipientId: 'BROADCAST',
    type: 'SOS',
    payload: JSON.stringify({ text, location: location || null }),
    timestamp: Date.now(),
    ttl: SOS_TTL,
    delivered: false, // SOS never really "completes" — it just expires via TTL
    route: [myDeviceId],
  };

  saveMessage(msg);
  markMessageSeen(msg.id);

  getConnectedPeers().forEach((peer) => {
    sendToPeer(peer.endpointId, msg);
  });

  return msg;
}

// Optional: call this on an interval if the user enables "repeat broadcast"
export function startRepeatingSOS(sosParams, intervalMs = 5 * 60 * 1000) {
  sendSOS(sosParams); // send immediately once
  return setInterval(() => sendSOS(sosParams), intervalMs);
}

export function stopRepeatingSOS(intervalId) {
  clearInterval(intervalId);
}