"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChannels = exports.consumeContent = exports.emitContent = exports.createChannel = void 0;
const media_translation_1 = require("@google-cloud/media-translation");
const error_1 = require("../error");
const radioChannel_1 = require("../models/radioChannel");
const radioHost_1 = require("../models/radioHost");
const utils_1 = require("../utils");
// ================ CONFIGURE MEDIA TRANSLATION API ================== //
// Creates a client
const client = new media_translation_1.SpeechTranslationServiceClient();
// Create a recognize stream
const stream = client.streamingTranslateSpeech();
// ======================== DEFINE HANDLERS ========================== //
const createChannel = (req, res, next) => {
    console.log("createChannel");
    // radio host must be authenticated
    // TODO: require that radio host specifically is authenticated
    if (req.isUnauthenticated()) {
        console.log("unauthenticated");
        return next(new error_1.Error(401, error_1.ErrorType.UNAUTHORIZED, 'client is not authenticated'));
    }
    // validate arguments
    try {
        (0, utils_1.validateArgument)(req.body, ["name"], ["string"], [true]);
        console.log("valid params");
    }
    catch (e) {
        return next(e);
    }
    // get radio host id from url params
    let radioHostId = req.params.radioHostId;
    console.log("radio host ID: " + radioHostId);
    // make sure radio host exists
    radioHost_1.RadioHost
        .findById(radioHostId)
        .exec((err, radioHost) => {
        if (err) {
            console.log("error getting radio host");
            return next(new error_1.Error(500, error_1.ErrorType.INTERNAL_ERROR, 'something wrong happened'));
        }
        if (!radioHost) {
            console.log("radio host doesn't exist");
            return next(new error_1.Error(404, error_1.ErrorType.NOT_FOUND, 'could not find radio host with id "' + radioHostId + '"'));
        }
        console.log("found radio host with id " + radioHost._id);
        // make sure channel does not exist on database
        radioChannel_1.RadioChannel
            .findOne({ radio_host_id: radioHost._id, name: req.body.name })
            .exec((err, radioChannel) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.log("error finding radio channel");
                return next(new error_1.Error(500, error_1.ErrorType.INTERNAL_ERROR, 'something wrong happened'));
            }
            if (radioChannel) {
                console.log("radio channel already exists");
                return next(new error_1.Error(400, error_1.ErrorType.INVALID_REQUEST, 'host with id "' + radioHost._id + '" already has a channel with name "' + req.body.name + '"'));
            }
            // create radio channel
            const rc = new radioChannel_1.RadioChannel({
                radio_host_id: radioHost._id,
                name: req.body.name,
            });
            yield rc.save((err, radioChannel) => {
                if (err) {
                    return next(new error_1.Error(500, error_1.ErrorType.INTERNAL_ERROR, 'something wrong happened'));
                }
                return res.end(JSON.stringify({
                    id: radioChannel._id,
                    radio_host_id: radioHost._id,
                    name: radioChannel.name,
                }));
            });
        }));
    });
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
    res.send('you hit getChannels\n');
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
