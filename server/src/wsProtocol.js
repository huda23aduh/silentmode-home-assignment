// Helpers: pack a chunk with header; parse incoming binary frames

const { Buffer } = require('buffer');

function packChunk(headerObj, chunkBuffer) {
  const headerJson = Buffer.from(JSON.stringify(headerObj), 'utf8');
  const headerLenBuf = Buffer.allocUnsafe(4);
  headerLenBuf.writeUInt32BE(headerJson.length, 0);
  return Buffer.concat([headerLenBuf, headerJson, chunkBuffer]);
}

function parsePackedMessage(buffer) {
  // buffer: Buffer starting with 4-byte header length
  if (buffer.length < 4) throw new Error('Buffer too small');
  const headerLen = buffer.readUInt32BE(0);
  const headerStart = 4;
  const headerEnd = 4 + headerLen;
  if (buffer.length < headerEnd) throw new Error('Incomplete header');
  const headerJson = buffer.slice(headerStart, headerEnd).toString('utf8');
  const header = JSON.parse(headerJson);
  const chunk = buffer.slice(headerEnd);
  return { header, chunk };
}

module.exports = { packChunk, parsePackedMessage };
