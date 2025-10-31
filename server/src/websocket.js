const WebSocket = require('ws');
const { AUTH_SECRET } = require('./config');
const registry = require('./registry');
const transfers = require('./transfers');
const logger = require('./logger');
const { parsePackedMessage } = require('./wsProtocol');

function init(server, path) {
  const wss = new WebSocket.Server({ server, path });

  wss.on('connection', (ws, req) => {
    const params = new URLSearchParams(req.url.split('?')[1] || '');
    const token = params.get('token');
    const clientId = params.get('clientId');

    if (!token || token !== AUTH_SECRET) {
      ws.close(4001, 'unauthorized');
      return;
    }

    registry.addClient(clientId, ws);

    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        const { header, chunk } = parsePackedMessage(Buffer.from(data));
        return transfers.handleChunk(header, chunk);
      }

      const msg = JSON.parse(data.toString());
      handleControl(msg, clientId);
    });

    ws.on('close', () => transfers.cleanupClient(clientId));
    ws.send(JSON.stringify({ type: 'hello', serverTime: new Date().toISOString() }));
  });
}

function handleControl(msg, clientId) {
  switch (msg.type) {
    case 'register_meta':
      return registry.updateMeta(clientId, msg.meta);

    case 'upload_start':
      return transfers.handleUploadStart(msg);

    case 'upload_end':
      return transfers.handleUploadEnd(msg);

    case 'heartbeat':
      return registry.touch(clientId);

    default:
      logger.warn('unknown control type', msg.type);
  }
}

module.exports = { init };
