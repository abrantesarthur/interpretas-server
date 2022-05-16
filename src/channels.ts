import { SpeechTranslationServiceClient } from '@google-cloud/media-translation';
import { RequestHandler } from 'express';


// ================ CONFIGURE MEDIA TRANSLATION API ================== //
  
// Creates a client
const client = new SpeechTranslationServiceClient();

// Create a recognize stream
const stream = client.streamingTranslateSpeech();


// ==================== DEFINE HANDLERS ====================== //

const createChannel: RequestHandler = (req, res) => {
    // 'isAuthenticated' is merged into 'req' by 'passport'
    if(req.isAuthenticated()) {
        res.send('you hit getChannels\n')
    } else {
        res.send('you are not authenticated\n')
    }
}

const emitContent: RequestHandler = (req, res) => {
    if(req.isAuthenticated()) {
        res.send('you hit getChannels\n')
    } else {
        res.send('you are not authenticated\n')
    }
}

const consumeContent: RequestHandler = (req, res) => {
    res.end("consumeContent");

}

const getChannels: RequestHandler = (req, res) => {
    res.end("getChannels");   
}

// ==================== EXPORT HANDLERS ====================== //

export {
    createChannel,
    emitContent,
    consumeContent,
    getChannels
};


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