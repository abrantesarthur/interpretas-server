'use strict';

// load configuration variables from .env file
require('dotenv').config();

// // Import google's Media Translation client library
// const mediaTranslation = require('@google-cloud/media-translation');
// const mediaTranslationClient = mediaTranslation.SpeechTranslationServiceClient();

// ====================== CONFIGURE SERVER ============================ //

// instantiate the express server
import express = require('express');
const app = express();

import bodyParser = require('body-parser');

// middleware to parse json
app.use(bodyParser.json())

import http = require('http');
const server = http.createServer(app);


// =========================== ROUTERS ================================ //

app.get("/", (req, res) => {
    res.end("Hello world\n");
})

app.post('/channel', (req, res) => {
    console.log(req.body);
    res.end("received");
});

// =========================== START SERVER ================================ //

const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
server.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
})
