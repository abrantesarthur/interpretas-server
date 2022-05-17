"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChannels = exports.consumeContent = exports.emitContent = exports.createChannel = void 0;
const media_translation_1 = require("@google-cloud/media-translation");
// ================ CONFIGURE MEDIA TRANSLATION API ================== //
// Creates a client
const client = new media_translation_1.SpeechTranslationServiceClient();
// Create a recognize stream
const stream = client.streamingTranslateSpeech();
// ==================== DEFINE HANDLERS ====================== //
const createChannel = (req, res) => {
    // 'isAuthenticated' is merged into 'req' by 'passport'
    if (req.isAuthenticated()) {
        res.send('you hit getChannels\n');
    }
    else {
        res.send('you are not authenticated\n');
    }
};
exports.createChannel = createChannel;
const emitContent = (req, res) => {
    if (req.isAuthenticated()) {
        res.send('you hit getChannels\n');
    }
    else {
        res.send('you are not authenticated\n');
    }
};
exports.emitContent = emitContent;
const consumeContent = (req, res) => {
    res.end("consumeContent");
};
exports.consumeContent = consumeContent;
const getChannels = (req, res) => {
    if (req.isAuthenticated()) {
        res.send('you hit getChannels\n');
    }
    else {
        res.send('you are not authenticated\n');
    }
};
exports.getChannels = getChannels;
// app.post('/channel', (req, res) => {
//     const audioContent = req.body.audio_content;
//     // TODO: check that the audio content is not undefined
//     // TODO: accumulate the output then send it
//     const config = {
//         // TODO: make dynamic
//         // translate from english to portuguese
//         audioConfig: {
//           audioEncoding: "linear16",
//           sourceLanguageCode: "en-US",
//           targetLanguageCode: "pt-BR",
//         },
//         // continue translating even if speaker pauses
//         singleUtterance: false,       
//     };
//     // TODO: this is causing a memory leak: many listeners are being set
//     stream.on('data', data => {
//       res.end(`\n${data.result.textTranslationResult.translation}`);
//     });
//     // listen for google Media Translation errors and send to client
//     stream.on('error', e => {
//       res.status(500);
//       res.send("failed to translate audio");
//     })
//     if(!stream.destroyed) {
//       // First request needs to have only a streaming config, no data.
//       if(isFirst) {
//         console.log("\nfirst");
//          // listen for google Media Translation responses and send to client
//         stream.write({
//           streamingConfig: config,
//           audioContent: null,
//         });
//         isFirst = false;
//       }
//       stream.write({
//         streamingConfig: config,
//         audioContent: audioContent,
//       });
//     }
// });
