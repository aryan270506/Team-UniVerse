import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

export function createMessageEnvelope({ senderId, senderName, recipientId, type = 'chat', payload = {}, ttl = 5 }) {
  return {
    id: Crypto.randomUUID(),
    senderId,
    senderName: senderName || '',
    recipientId,
    type,
    payload: JSON.stringify(payload),
    timestamp: Date.now(),
    ttl,
    delivered: false,
    route: [senderId],
  };
}

export function createHandshakeEnvelope({ senderId, senderName, recipientId, profilePhoto = null, appVersion = '1.0.0', capabilities = ['chat'] }) {
  return createMessageEnvelope({
    senderId,
    senderName,
    recipientId,
    type: 'handshake',
    payload: {
      deviceId: senderId,
      displayName: senderName,
      profilePhoto,
      appVersion,
      platform: Platform.OS,
      capabilities,
    },
    ttl: 1,
  });
}

export function parseEnvelope(rawPayload) {
  if (!rawPayload) {
    return null;
  }

  if (typeof rawPayload === 'string') {
    try {
      return JSON.parse(rawPayload);
    } catch (e) {
      return { type: 'chat', text: rawPayload };
    }
  }

  return rawPayload;
}
