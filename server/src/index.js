require('dotenv').config();
const express = require('express');
const http = require('http');
const morgan = require('morgan');

const { PORT, WS_PATH } = require('./config');
const routes = require('./routes');
const ws = require('./websocket');
const { ensureDirSync } = require('./utils');

ensureDirSync('./downloads');

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(routes);

const server = http.createServer(app);

ws.init(server, WS_PATH);

server.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
  console.log(`WS path: ${WS_PATH}`);
});
