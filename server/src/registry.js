// src/registry.js

const clients = new Map();

function addClient(clientId, ws) {
  clients.set(clientId, { ws, lastSeen: Date.now(), meta: {} });
}

function removeClient(clientId) {
  clients.delete(clientId);
}

function touch(clientId) {
  const entry = clients.get(clientId);
  if (entry) entry.lastSeen = Date.now();
}

function updateMeta(clientId, meta) {
  const entry = clients.get(clientId);
  if (entry) {
    entry.meta = meta ?? {};
    entry.lastSeen = Date.now();
  }
}

function get(clientId) {
  return clients.get(clientId);
}

function list() {
  return [...clients.entries()].map(([clientId, info]) => ({
    clientId,
    lastSeen: info.lastSeen,
    meta: info.meta
  }));
}

module.exports = {
  addClient,
  removeClient,
  touch,
  updateMeta,
  get,
  list
};
