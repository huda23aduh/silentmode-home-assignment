const fs = require('fs');
const path = require('path');

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function nowTs() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

module.exports = { ensureDirSync, nowTs };
