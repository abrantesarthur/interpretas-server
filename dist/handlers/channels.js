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
exports.getAllChannels = exports.getChannels = exports.consumeAudioContent = exports.emitAudioContent = exports.createChannel = void 0;
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
    // radio host must be authenticated
    // TODO: require that radio host specifically is authenticated
    if (req.isUnauthenticated()) {
        return next(new error_1.Error(401, error_1.ErrorType.UNAUTHORIZED, 'client is not authenticated'));
    }
    // validate arguments
    try {
        (0, utils_1.validateArgument)(req.body, ["name"], ["string"], [true]);
    }
    catch (e) {
        return next(e);
    }
    // get radio host id from url params
    let radioHostId = req.params.radioHostId;
    // make sure radio host exists
    radioHost_1.RadioHost
        .findById(radioHostId)
        .exec((err, radioHost) => {
        if (err) {
            return next(new error_1.Error(500, error_1.ErrorType.INTERNAL_ERROR, 'something wrong happened'));
        }
        if (!radioHost) {
            return next(new error_1.Error(404, error_1.ErrorType.NOT_FOUND, 'could not find radio host with id "' + radioHostId + '"'));
        }
        // make sure channel does not exist on database
        radioChannel_1.RadioChannel
            .findOne({ radio_host_id: radioHost._id, name: req.body.name })
            .exec((err, radioChannel) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                return next(new error_1.Error(500, error_1.ErrorType.INTERNAL_ERROR, 'something wrong happened'));
            }
            if (radioChannel) {
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
const getChannels = (req, res, next) => {
    console.log("getChannels");
    // get radio host id from url params
    let radioHostId = req.params.radioHostId;
    // make sure radio host exists
    radioHost_1.RadioHost
        .findById(radioHostId)
        .exec((err, radioHost) => {
        if (err) {
            return next(new error_1.Error(500, error_1.ErrorType.INTERNAL_ERROR, 'something wrong happened'));
        }
        if (!radioHost) {
            return next(new error_1.Error(404, error_1.ErrorType.NOT_FOUND, 'could not find radio host with id "' + radioHostId + '"'));
        }
        // find channels
        radioChannel_1.RadioChannel
            .find({ radio_host_id: radioHost._id })
            .exec((err, radioChannels) => {
            if (err) {
                return next(new error_1.Error(500, error_1.ErrorType.INTERNAL_ERROR, 'something wrong happened'));
            }
            if (!radioChannels || radioChannels.length === 0) {
                return next(new error_1.Error(400, error_1.ErrorType.INVALID_REQUEST, 'host with id "' + radioHost._id + '" has no channels'));
            }
            let channels = [];
            radioChannels.forEach((rc) => {
                channels.push({
                    "id": rc._id,
                    "radio_host_id": rc.radio_host_id,
                    "name": rc.name,
                });
            });
            return res.end(JSON.stringify(channels));
        });
    });
};
exports.getChannels = getChannels;
const emitAudioContent = (audioContent, socket) => {
    let request = socket.request;
    // user must be authenticated to emit audio content
    if (request.isUnauthenticated()) {
        return;
    }
    // make sure channel id is defined within the session
    if (request.session.channelID === undefined || request.session.channelID.length === 0) {
        return;
    }
    let chID = request.session.channelID;
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
    // configure translation listeners only once
    if (request.session.firstRequest === true) {
        // broadcasts translation results to all clients subscribed to the room
        stream.on('data', d => {
            const { error, result, _ } = d;
            if (error !== null) {
            }
            // TODO: accumulate
            socket.emit("translatedAudioContent", result.textTranslationResult.translation);
            // TODO: send only to children
            // socket.to(chID).emit("received audio content", data);
        });
        // register error listener
        stream.on('error', e => {
            // TODO: how do we handle errors?
        });
        // send first request, which only needs streaming config
        stream.write({
            streamingConfig: config,
            audioContent: null,
        });
        request.session.firstRequest = false;
        // TODO: probably have to synchronously save sesssion here, instead
        // of waiting until the end of request.
    }
    // subsequent requests need audioContent
    stream.write({
        streamingConfig: config,
        audioContent: audioContent,
    });
};
exports.emitAudioContent = emitAudioContent;
const consumeAudioContent = (req, res) => {
    res.sendFile(__dirname + "/../channels.html");
};
exports.consumeAudioContent = consumeAudioContent;
const getAllChannels = (req, res) => {
    res.sendFile(__dirname + "/channels.html");
};
exports.getAllChannels = getAllChannels;
