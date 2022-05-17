import { SpeechTranslationServiceClient } from '@google-cloud/media-translation';
import { RequestHandler } from 'express';
import { Error, ErrorType } from '../error';
import { RadioChannel } from '../models/radioChannel';
import { RadioHost } from '../models/radioHost';
import { validateArgument } from '../utils';


// ================ CONFIGURE MEDIA TRANSLATION API ================== //
  
// Creates a client
const client = new SpeechTranslationServiceClient();

// Create a recognize stream
const stream = client.streamingTranslateSpeech();


// ======================== DEFINE HANDLERS ========================== //

const createChannel: RequestHandler = (req, res, next) => {

    // radio host must be authenticated
    // TODO: require that radio host specifically is authenticated
    if(req.isUnauthenticated()) {
        return next(new Error(
            401,
            ErrorType.UNAUTHORIZED,
            'client is not authenticated'
        ));
    }

    // validate arguments
    try {
        validateArgument(req.body, ["name"], ["string"], [true]);
    } catch(e) {
        return next(e);
    }

    // get radio host id from url params
    let radioHostId  = req.params.radioHostId;


    // make sure radio host exists
    RadioHost
        .findById(radioHostId)
        .exec((err, radioHost)  => {
            if(err) {
                return next(new Error(500, ErrorType.INTERNAL_ERROR, 'something wrong happened'));
            }

            if(!radioHost) {
                return next(new Error(
                    404,
                    ErrorType.NOT_FOUND,
                    'could not find radio host with id "' + radioHostId + '"'
                ));
            }


            // make sure channel does not exist on database
            RadioChannel
                .findOne({radio_host_id: radioHost._id, name: req.body.name})
                .exec(async (err, radioChannel) => {
                    if(err) {
                        return next(new Error(500, ErrorType.INTERNAL_ERROR, 'something wrong happened'));
                    }
                    
                    if(radioChannel) {
                        return next(new Error(
                            400,
                            ErrorType.INVALID_REQUEST,
                            'host with id "' + radioHost._id + '" already has a channel with name "' + req.body.name + '"'
                        ));
                    }


                    // create radio channel
                    const rc = new RadioChannel({
                        radio_host_id: radioHost._id,
                        name: req.body.name,
                    });

                    await rc.save((err: any, radioChannel: any) => {
                        if(err) {
                            return next(new Error(500, ErrorType.INTERNAL_ERROR, 'something wrong happened'));
                        }

                        return res.end(JSON.stringify({
                            id: radioChannel._id,
                            radio_host_id: radioHost._id,
                            name: radioChannel.name,
                        }))
                    })

            })
    })
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
    res.send('you hit getChannels\n')
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