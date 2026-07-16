import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('meshlink.db');

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

export function getMessagesWithPeer(myId, peerId) {
  return db.getAllSync(
    `SELECT * FROM messages
     WHERE (senderId = ? AND recipientId = ?)
        OR (senderId = ? AND recipientId = ?)
     ORDER BY timestamp ASC`,
    [myId, peerId, peerId, myId]
  );
}

export function getBroadcastMessages() {
  return db.getAllSync(
    `SELECT * FROM messages WHERE recipientId = 'BROADCAST' ORDER BY timestamp DESC`
  );
}

export function getUndeliveredMessages() {
  return db.getAllSync(`SELECT * FROM messages WHERE delivered = 0 AND ttl > 0`);
}

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

export function purgeOldSeenIds() {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  db.runSync(`DELETE FROM seen_message_ids WHERE timestamp < ?`, [oneDayAgo]);
}
