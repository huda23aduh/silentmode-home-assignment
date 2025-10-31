# Software Engineer – Home Assignment
Cloud-Initiated File Download from On-Prem Clients

This project demonstrates a system where a cloud-hosted server can **on-demand** download a ~100MB file from **on-premise clients**, even though the clients are located behind private LANs/firewalls and are not publicly reachable.

The server triggers the download via REST API, and the client streams the file back over a persistent **WebSocket** connection in binary chunks. This avoids port forwarding and inbound firewall rules.

---

## ✨ Features

✅ NAT/firewall friendly (outbound WebSocket)  
✅ Server-initiated download  
✅ Chunked binary streaming (low memory usage)  
✅ SHA-256 checksum verification  
✅ Multiple clients supported concurrently  
✅ Heartbeats for liveness monitoring  
✅ Backpressure handling for stable streaming  
✅ Requires no inbound ports on the client  

---

## 🧱 Architecture Overview

> For best viewing, use desktop width.

```text
        +--------------------------+
        |        Cloud Server      |
        |      (Public Facing)     |
        +--------------+-----------+
                       ^
                       | Persistent WebSocket
                       |
   ---------------------|--------------------------------
 Private Network        |                        Private Network
                       |
        +--------------+---------------+       +--------------+---------------+
        |         Client (shop-001)    |       |        Client (shop-002)     |
        |     ~100MB file on disk      |       |     ~100MB file on disk      |
        +------------------------------+       +------------------------------+
```

Clients initiate outbound WebSocket connections and wait for remote control instructions.

---

## 📂 Repository Structure

```text
.
├── README.md
├── client/                    # On-prem client agent
│   ├── 100mb.txt              # Dummy 100MB file
│   └── src/client.js
├── server/                    # Cloud server
│   ├── downloads/             # Generated downloads
│   └── src/                   # Modular server components
│       ├── config.js
│       ├── index.js
│       ├── logger.js
│       ├── registry.js
│       ├── routes.js
│       ├── transfers.js
│       ├── utils.js
│       ├── websocket.js
│       └── wsProtocol.js
└── scripts/                   # Helpers for testing
    ├── spawn-multiple-clients.js
    ├── trigger-concurrent.js
    └── trigger-download.js

```

---

## ✅ Requirements

- Node.js **v18+**
- npm (bundled with Node)
- Outbound network connectivity from client → server
- Works on:
  - Windows
  - macOS
  - Linux

---

## 🚀 Setup

Clone the repository:

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

---

## 🖥️ Running the Server (Cloud)

```bash
cd server
cp .env.example .env
npm install
npm start
```

Expected output:

```
Server running on port 8080
WebSocket path: /ws
```

Downloaded files will appear in:

```
server/downloads/
```

---

## 🏠 Running a Client (On-Prem Simulation)

Open a **new** terminal:

```bash
cd client
cp .env.example .env
npm install
```

Edit `.env`:

```
SERVER_URL=ws://localhost:8080/ws
CLIENT_ID=shop-001
AUTH_SECRET=some-pre-shared-secret
FILE_PATH=./100mb.txt
CHUNK_SIZE=65536
```

---

## 🔎 Verify Connected Clients

```bash
curl "http://localhost:8080/clients" \
  -H "x-api-key: some-pre-shared-secret"
```

Response example:

```json
[
  {
    "clientId": "shop-001",
    "lastSeen": 1730361234567,
    "meta": {}
  }
]
```

---

## 🎯 Trigger a Download

```bash
curl -X POST "http://localhost:8080/download/shop-001" \
  -H "x-api-key: some-pre-shared-secret" \
  -H "Content-Type: application/json" \
  -d '{"fileKey": null}'
```

Server logs:

```
upload_start for <uuid> filename=100mb-example.bin size=104857600
upload_end <uuid> computed=<sha256> bytes=104857600
```

---

## 📥 Check the Output

Files are saved under:

```
server/downloads/
```

Example:

```
shop-001_2025-10-31T15-30-00-123Z.bin
```

Validate size:

```bash
ls -lh server/downloads/
```

---

## 🧪 Multiple Clients

Open a new terminal and edit `.env`:

```
CLIENT_ID=shop-002
```

Start another client:

```bash
npm start
```

Trigger download:

```bash
curl -X POST "http://localhost:8080/download/shop-002" \
  -H "x-api-key: some-pre-shared-secret"
```

---

## 🕹️ Optional CLI Trigger

```bash
node scripts/trigger-download.js shop-001
```

---

## 🔐 Security Considerations

Implemented:

- Token-based authentication
- No inbound client ports
- Server-controlled data pull

Future improvements:

- TLS (`wss://`)
- mTLS certificates
- JWT short-lived tokens
- Path whitelisting
- Request authorization scopes

---

## 🧠 Why This Works Behind NAT

Clients open **outbound** connections, which firewalls allow by default.

The server re-uses this socket to send commands back:

✅ No port forwarding  
✅ No VPN required  
✅ No public IP needed  

This is the same pattern used in IoT and point-of-sale industries.

---

## ⚙️ Technical Design Summary

- Chunked binary streaming
- Server writes to disk via `fs.createWriteStream`
- SHA-256 integrity checks
- Heartbeats to detect disconnects
- Backpressure avoidance via WebSocket buffering
- Multi-client concurrency tracking via `Map`
- Clean transfer teardown

---

## 🚑 Troubleshooting

### Client not visible in `/clients`
- Restart after editing `.env`
- Secrets must match

### File downloads but is 0 bytes
Ensure `FILE_PATH` exists on client side.

### Unauthorized error
Include header:

```
-H "x-api-key: some-pre-shared-secret"
```

### Stale connection
Restart client (auto reconnect enabled).

---

## 🧹 Cleanup Downloads

```bash
rm server/downloads/*
```

---

## ✅ Tested On

- macOS Sonoma
- Ubuntu 22.04 Linux
- Windows 10 / 11 (PowerShell)

---

## 🧾 License

MIT — free to use.

---

## 🙋 Support

Feel free to open an issue

---
