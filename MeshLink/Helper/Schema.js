// storage/db.js
//
// This is your local "database" — just a file saved on the phone itself.
// No internet, no server, no connection string. Everything here runs
// instantly and offline.

import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('meshlink.db');

// Call this ONCE when the app starts (see hooks/useMesh.js)
export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT,
      recipientId TEXT,
      senderName TEXT,
      type TEXT,
      payload TEXT,
      timestamp INTEGER,
      ttl INTEGER,
      delivered INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS peers (
      deviceId TEXT PRIMARY KEY,
      displayName TEXT,
      endpointId TEXT,
      lastSeen INTEGER,
      connected INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS seen_message_ids (
      id TEXT PRIMARY KEY,
      timestamp INTEGER
    );
  `);
}

// ---------- MESSAGES ----------

export function saveMessage(msg) {
  db.runSync(
    `INSERT OR REPLACE INTO messages
     (id, senderId, recipientId, senderName, type, payload, timestamp, ttl, delivered)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      msg.id,
      msg.senderId,
      msg.recipientId,
      msg.senderName || '',
      msg.type,
      msg.payload,
      msg.timestamp,
      msg.ttl,
      msg.delivered ? 1 : 0,
    ]
  );
}

export function markDelivered(messageId) {
  db.runSync(`UPDATE messages SET delivered = 1 WHERE id = ?`, [messageId]);
}

// Get every message for a specific 1:1 chat with one peer
export function getMessagesWithPeer(myId, peerId) {
  return db.getAllSync(
    `SELECT * FROM messages
     WHERE (senderId = ? AND recipientId = ?)
        OR (senderId = ? AND recipientId = ?)
     ORDER BY timestamp ASC`,
    [myId, peerId, peerId, myId]
  );
}

// Get every broadcast/SOS message (recipientId = 'BROADCAST')
export function getBroadcastMessages() {
  return db.getAllSync(
    `SELECT * FROM messages WHERE recipientId = 'BROADCAST' ORDER BY timestamp DESC`
  );
}

// Messages that still need to be relayed/delivered — used for
// store-and-forward: whenever a new peer connects, we re-check this list
export function getUndeliveredMessages() {
  return db.getAllSync(`SELECT * FROM messages WHERE delivered = 0 AND ttl > 0`);
}

// ---------- PEERS ----------

export function upsertPeer(peer) {
  db.runSync(
    `INSERT OR REPLACE INTO peers (deviceId, displayName, endpointId, lastSeen, connected)
     VALUES (?, ?, ?, ?, ?)`,
    [peer.deviceId, peer.displayName, peer.endpointId, peer.lastSeen, peer.connected ? 1 : 0]
  );
}

export function setPeerConnected(deviceId, connected) {
  db.runSync(
    `UPDATE peers SET connected = ?, lastSeen = ? WHERE deviceId = ?`,
    [connected ? 1 : 0, Date.now(), deviceId]
  );
}

export function getAllPeers() {
  return db.getAllSync(`SELECT * FROM peers ORDER BY connected DESC, lastSeen DESC`);
}

// ---------- DEDUP (prevents a message being processed twice) ----------

export function hasSeenMessage(id) {
  const rows = db.getAllSync(`SELECT id FROM seen_message_ids WHERE id = ?`, [id]);
  return rows.length > 0;
}

export function markMessageSeen(id) {
  db.runSync(
    `INSERT OR IGNORE INTO seen_message_ids (id, timestamp) VALUES (?, ?)`,
    [id, Date.now()]
  );
}

// Call occasionally (e.g. on app start) to stop this table growing forever
export function purgeOldSeenIds() {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  db.runSync(`DELETE FROM seen_message_ids WHERE timestamp < ?`, [oneDayAgo]);
}