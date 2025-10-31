const fs = require('fs');
const crypto = require('crypto');
const { nowTs } = require('./utils');
const { get } = require('./registry');
const logger = require('./logger');

const activeTransfers = new Map();

function createTransfer(clientId, fileKey, uploadDir) {
  const requestId = crypto.randomUUID();
  const filename = `${clientId}_${nowTs()}${fileKey ? `_${fileKey}` : ''}.bin`;
  const outPath = `${uploadDir}/${filename}`;

  const writeStream = fs.createWriteStream(outPath);
  const hash = crypto.createHash('sha256');

  activeTransfers.set(requestId, { clientId, writeStream, hash, bytesReceived: 0, outPath, filename });

  return { requestId, filename, outPath };
}

function handleUploadStart({ requestId, filename, filesize }) {
  const t = activeTransfers.get(requestId);
  if (!t) return;

  t.expectedSize = filesize;
  logger.info(`upload_start ${requestId} '${filename}' (${filesize} bytes)`);
}

function handleUploadEnd({ requestId }) {
  const t = activeTransfers.get(requestId);
  if (!t) return;

  t.writeStream.end(() => {
    const computed = t.hash.digest('hex');
    const client = get(t.clientId);

    logger.info(`upload_end ${requestId} bytes=${t.bytesReceived} checksum=${computed}`);

    client?.ws.send(JSON.stringify({ type: 'upload_received', requestId, computed, ok: true }));
    activeTransfers.delete(requestId);
  });
}

function handleChunk({ requestId }, chunk) {
  const t = activeTransfers.get(requestId);
  if (!t) return logger.warn('chunk for inactive', requestId);

  t.hash.update(chunk);
  t.bytesReceived += chunk.length;
  t.writeStream.write(chunk);
}

function cleanupClient(clientId) {
  for (const [id, t] of activeTransfers.entries()) {
    if (t.clientId === clientId) {
      t.writeStream.destroy();
      activeTransfers.delete(id);
    }
  }
}

module.exports = {
  createTransfer,
  handleUploadStart,
  handleUploadEnd,
  handleChunk,
  cleanupClient
};
