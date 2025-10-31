// client.js
require('dotenv').config();
const fs = require('fs');
const WebSocket = require('ws');
const crypto = require('crypto');

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:8080/ws';
const CLIENT_ID = process.env.CLIENT_ID || `client-${Math.floor(Math.random() * 10000)}`;
const AUTH_SECRET = process.env.AUTH_SECRET || 'change_me';
const FILE_PATH = process.env.FILE_PATH || './samplefile.bin';
const RECONNECT = process.env.RECONNECT !== 'false';
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '65536', 10);

let ws;
let connected = false;
let backoff = 1000;

function connect() {
  const wssUrl = new URL(SERVER_URL);
  wssUrl.searchParams.set('token', AUTH_SECRET);
  wssUrl.searchParams.set('clientId', CLIENT_ID);

  ws = new WebSocket(wssUrl.toString());

  ws.on('open', () => {
    console.log('Connected to server');
    connected = true;
    backoff = 1000;
    // send some metadata
    ws.send(JSON.stringify({ type: 'register_meta', meta: { clientId: CLIENT_ID, hostname: require('os').hostname() } }));
    startHeartbeat();
  });

  ws.on('message', async (message, isBinary) => {
    try {
      if (!isBinary) {
        const msg = typeof message === 'string' ? JSON.parse(message) : JSON.parse(message.toString());
        await handleControl(msg);
      } else {
        console.log('unexpected binary message on client');
      }
    } catch (err) {
      console.error('message handle error', err);
    }
  });

  ws.on('close', (code) => {
    console.log('disconnected', code);
    connected = false;
    if (RECONNECT) reconnect();
  });

  ws.on('error', (err) => {
    console.error('ws error', err);
    ws.close();
  });
}

function reconnect() {
  setTimeout(() => {
    backoff = Math.min(backoff * 1.5, 30000);
    console.log(`reconnecting... backoff=${backoff}`);
    connect();
  }, backoff);
}

let heartbeatTimer;
function startHeartbeat() {
  clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat', ts: Date.now() }));
    }
  }, 30_000);
}

async function handleControl(msg) {
  if (!msg.type) return;
  switch (msg.type) {
    case 'download_request':
      console.log('download_request received', msg);
      // server is asking this client to send a file
      await doUpload(msg.requestId, msg.fileKey, msg.chunkSize || CHUNK_SIZE);
      break;
    case 'upload_received':
      console.log('server confirms upload_received', msg);
      break;
    default:
      console.log('control message', msg);
  }
}

function packChunk(headerObj, chunkBuffer) {
  const headerJson = Buffer.from(JSON.stringify(headerObj), 'utf8');
  const headerLenBuf = Buffer.allocUnsafe(4);
  headerLenBuf.writeUInt32BE(headerJson.length, 0);
  return Buffer.concat([headerLenBuf, headerJson, chunkBuffer]);
}

async function doUpload(requestId, fileKey, chunkSize) {
  // choose file path based on request (for demo we use FILE_PATH or fileKey)
  const filePath = fileKey || FILE_PATH;
  if (!fs.existsSync(filePath)) {
    console.error('file not found', filePath);
    ws.send(JSON.stringify({ type: 'error', message: 'file_not_found', requestId }));
    return;
  }

  const stat = fs.statSync(filePath);
  const filesize = stat.size;
  const hash = crypto.createHash('sha256');

  // notify server upload starting
  ws.send(JSON.stringify({ type: 'upload_start', requestId, filename: filePath, filesize }));

  // stream file
  const rs = fs.createReadStream(filePath, { highWaterMark: chunkSize });
  let seq = 0;
  for await (const chunk of rs) {
    seq++;
    hash.update(chunk);

    const header = { requestId, seq, timestamp: Date.now() };
    const packed = packChunk(header, chunk);

    // backpressure: if bufferedAmount is large, wait until it drops
    await sendWithBackpressure(packed);
  }

  const digest = hash.digest('hex');
  // notify server upload_end
  ws.send(JSON.stringify({ type: 'upload_end', requestId, checksum: digest, filesize }));

  console.log('upload finished', { requestId, digest });
}

function sendWithBackpressure(buf) {
  return new Promise((resolve, reject) => {
    try {
      ws.send(buf, { binary: true }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    } catch (err) {
      // handle bufferedAmount scenario
      const wait = () => {
        if (ws.bufferedAmount < 1024 * 1024 * 5) { // 5MB threshold
          try { ws.send(buf, { binary: true }, (err) => { if (err) reject(err); else resolve(); }); } catch (e) { reject(e); }
        } else {
          setTimeout(wait, 50);
        }
      };
      wait();
    }
  });
}

connect();
