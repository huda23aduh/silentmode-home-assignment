const path = require('path');

module.exports = {
  PORT: process.env.PORT || 8080,
  WS_PATH: process.env.WS_PATH || '/ws',
  AUTH_SECRET: process.env.AUTH_SECRET || 'change_me',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '..', 'downloads'),
  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE || '65536', 10),
  MAX_CONCURRENT_TRANSFERS: parseInt(process.env.MAX_CONCURRENT_TRANSFERS || '5', 10)
};
