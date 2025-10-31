#!/usr/bin/env node

const API_KEY = "some-pre-shared-secret";
const BASE = "http://localhost:8080";

const clients = [
  "shop-001",
  "shop-002",
  "shop-003",
  "shop-004",
  "shop-005"
];

(async () => {
  console.log("🚀 Triggering concurrent downloads...\n");

  await Promise.all(
    clients.map(id =>
      fetch(`${BASE}/download/${id}`, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fileKey: null })
      })
        .then(r => r.json())
        .then(j => console.log(`Triggered ${id}:`, j))
    )
  );
})();
