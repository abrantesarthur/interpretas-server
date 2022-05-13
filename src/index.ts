'use strict';

// load configuration variables from .env file
require('dotenv').config();

// // Import google's Media Translation client library
// const mediaTranslation = require('@google-cloud/media-translation');
// const mediaTranslationClient = mediaTranslation.SpeechTranslationServiceClient();

// ====================== CONFIGURE SERVER ============================ //

// instantiate the express server
import express = require('express');
import bodyParser = require('body-parser');
import http = require('http');
const app = express();
app.use(bodyParser.json())
const server = http.createServer(app);

// import endpoint handlers
import { login, signup } from './accounts';
import * as ch from "./channels"

// =========================== ROUTERS ================================ //


// account endpoints
app.post("/signup", signup);
app.post("/login", login);

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
})
