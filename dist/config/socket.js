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
exports.configureSocketConnection = void 0;
const media_translation_1 = require("@google-cloud/media-translation");
const utils_1 = require("../utils");
const ch = require("../handlers/channels");
// ================ CONFIGURE MEDIA TRANSLATION API ================== //
// Creates a client
const client = new media_translation_1.SpeechTranslationServiceClient();
// Create a recognize stream
const stream = client.streamingTranslateSpeech();
// ================ CONFIGURE SOCKET CONNECTION ================== //
const configureSocketConnection = (socket) => __awaiter(void 0, void 0, void 0, function* () {
    let request = socket.request;
    // make sure a channel_id was passed and is a string
    let channel_id = socket.handshake.query.channel_id;
    if (!(0, utils_1.isString)(channel_id) || channel_id.length == 0) {
        socket.disconnect();
        return;
    }
    // if this is an authenticated request, make sure user who connected owns the channel
    if (request.isAuthenticated()) {
        // get user id
        // let userID = request.session.passport.user;
        // TODO get user's channels and make sure he's the owner
        // set flag to true, so we handle translation API semantics correctly
        request.session.firstRequest = true;
        // register event handlers for when radio host broadcasts audio content
        socket.on("audioContent", (audioContent) => ch.emitAudioContent(audioContent, socket));
    }
    // subscribe socket to the channel room
    socket.join(channel_id);
    // save channel ID in session for easy access in subsequent events
    request.session.channelID = channel_id;
    // notify client that they can start sending requests
    socket.emit("connected");
});
exports.configureSocketConnection = configureSocketConnection;
