// simple node script to trigger /download
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const API_KEY = process.env.AUTH_SECRET || 'change_me';
const SERVER = process.env.SERVER_URL || 'http://localhost:8080';
async function trigger(clientId, fileKey) {
  const res = await fetch(`${SERVER}/download/${clientId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ fileKey })
  });
  const json = await res.json();
  console.log(json);
}
trigger(process.argv[2], process.argv[3] || null);
