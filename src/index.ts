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

app.get("/", (_, res) => {
    res.end("Hello world\n");
})

// Imports the Cloud Media Translation client library
import { SpeechTranslationServiceClient, protos } from '@google-cloud/media-translation';
  
// Creates a client
const client = new SpeechTranslationServiceClient();

// Create a recognize stream
const stream = client.streamingTranslateSpeech();
let isFirst = true;


app.post('/channel', (req, res) => {
    const audioContent = req.body.audio_content;

    // TODO: check that the audio content is not undefined

    // TODO: accumulate some input per user, then translate all at once

    const config = {
        // TODO: make dynamic
        // translate from english to portuguese
        audioConfig: {
          audioEncoding: "linear16",
          sourceLanguageCode: "en-US",
          targetLanguageCode: "pt-BR",
        },
        // continue translating even if speaker pauses
        singleUtterance: false,       
    };

    // TODO: this is causing a memory leak: many listeners are being set
    stream.on('data', data => {
      res.end(`\n${data.result.textTranslationResult.translation}`);
    });

    // listen for google Media Translation errors and send to client
    stream.on('error', e => {
      res.status(500);
      res.send("failed to translate audio");
    })
    

    if(!stream.destroyed) {
      // First request needs to have only a streaming config, no data.
      if(isFirst) {
        console.log("\nfirst");
         // listen for google Media Translation responses and send to client

        stream.write({
          streamingConfig: config,
          audioContent: null,
        });

        isFirst = false;
      }

      stream.write({
        streamingConfig: config,
        audioContent: audioContent,
      });
    }
});

// =========================== START SERVER ================================ //

const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
server.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
})





// doTranslationLoop();