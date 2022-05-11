'use strict';

// load configuration variables from .env file
require('dotenv').config();

// instantiate the express server
import express = require('express');
const app = express();
import http = require('http');
const server = http.createServer(app);

// // Import google's Media Translation client library
// const mediaTranslation = require('@google-cloud/media-translation');
// const mediaTranslationClient = mediaTranslation.SpeechTranslationServiceClient();


// =========================== ROUTERS ================================ //

app.post('/channel', (req, res) => {
    console.log(req.body);
    res.end(req.body);
});

// =========================== START SERVER ================================ //

const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
server.listen(port, hostname)
