#!/usr/bin/env node

// Usage:
// node scripts/spawn-multiple-clients.js 5
// (spawns 5 clients)

const { spawn } = require('child_process');
const path = require('path');

const n = parseInt(process.argv[2], 10);

if (!n || isNaN(n)) {
  console.error("Usage: node scripts/spawn-multiple-clients.js <numberOfClients>");
  process.exit(1);
}

console.log(`🚀 Spawning ${n} clients...\n`);

for (let i = 1; i <= n; i++) {
  const CLIENT_ID = `shop-${String(i).padStart(3, "0")}`;

  const child = spawn(
    process.platform === "win32" ? "cmd" : "npm",
    process.platform === "win32" ? ["/c", "npm", "start"] : ["start"],
    {
      cwd: path.join(__dirname, "../client"),
      env: {
        ...process.env,
        CLIENT_ID,
        // optional overrides
        FILE_PATH: "./../100mb.txt",
        CHUNK_SIZE: "65536",
      }
    }
  );

  child.stdout.on("data", data => {
    process.stdout.write(`[${CLIENT_ID}] ${data}`);
  });

  child.stderr.on("data", data => {
    process.stderr.write(`[${CLIENT_ID} ERROR] ${data}`);
  });

  child.on("close", code => {
    console.log(`[${CLIENT_ID}] exited with code ${code}`);
  });
}
