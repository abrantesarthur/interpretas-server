'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// load configuration variables from .env file
require('dotenv').config();
// import server libraries
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
// import endpoint handlers
const accounts_1 = require("./accounts");
const ch = require("./channels");
// ====================== CONFIGURE SERVER ============================ //
// instantiate the express server
const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);
// =========================== ROUTERS ================================ //
// account endpoints
app.post("/signup", accounts_1.signup);
app.post("/login", accounts_1.login);
// channel endpoints
app.post("/accounts/:accountId/channels", ch.createChannel);
app.post("/channels/:channelId", ch.emitContent);
app.get("channels/:channelId", ch.consumeContent);
app.get("/", ch.getChannels);
// =========================== START SERVER ================================ //
const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
server.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
});
