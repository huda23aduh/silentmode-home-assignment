const express = require('express');
const { createTransfer } = require('./transfers');
const registry = require('./registry');
const { AUTH_SECRET, CHUNK_SIZE, UPLOAD_DIR, MAX_CONCURRENT_TRANSFERS } = require('./config');

const router = express.Router();

function auth(req, res, next) {
  const token = req.headers['x-api-key'];
  if (token !== AUTH_SECRET) return res.status(401).json({ error: 'unauthorized' });
  next();
}

router.get('/clients', auth, (_req, res) => {
  res.json(registry.list());
});

router.post('/download/:clientId', auth, (req, res) => {
  const clientId = req.params.clientId;
  const client = registry.get(clientId);

  if (!client) return res.status(404).json({ error: 'not connected' });

  const { fileKey = null } = req.body;

  if (MAX_CONCURRENT_TRANSFERS <= 0) {
    return res.status(429).json({ error: 'too many concurrent transfers' });
  }

  const { requestId, filename, outPath } = createTransfer(clientId, fileKey, UPLOAD_DIR);

  client.ws.send(JSON.stringify({ type: 'download_request', requestId, fileKey, chunkSize: CHUNK_SIZE }));

  res.json({ ok: true, requestId, filename, outPath });
});

module.exports = router;
