'use strict';
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
// load configuration variables from .env file
require('dotenv').config();
// import server libraries
const express = require("express");
const http = require("http");
const socket_io_1 = require("socket.io");
// import server middlewares
const bodyParser = require("body-parser");
const session = require("express-session");
const sessionFileStore = require("session-file-store");
const SessionFileStore = sessionFileStore(session);
// import endpoint handlers
const auth_1 = require("./handlers/auth");
const ch = require("./handlers/channels");
// import database
// TODO: consider moving db out of mongoDB Atlas
const db = require("mongoose");
// other imports
const uuid_1 = require("uuid");
const error_1 = require("./error");
const auth_2 = require("./auth");
const passport = require("passport");
const utils_1 = require("./utils");
// ==================== CONFIGURE HTTP SERVER ========================== //
// instantiate the http server
const app = express();
const httpServer = http.createServer(app);
// json middleware
app.use(bodyParser.json());
// session middleware
const sessionMiddleware = session({
    // the function that generates unique session ids
    genid: (_) => (0, uuid_1.v4)(),
    // the secret used to sign the session ID cookie
    secret: process.env.SESSION_SECRET || "keyboard cat",
    // don't force the session to be saved back to the store, even if the session
    // was never modified during the request
    resave: false,
    // force a session that is uninitialized to be saved to the store
    saveUninitialized: true,
    // save sessions in files in `./sessions` folder instead of memory
    // this way, we don't lose session when the server crashes
    // TODO: consider using a database as a store (e.g., connect-sqlite3) (see http://www.passportjs.org/tutorials/password/session/)
    store: new SessionFileStore({
        ttl: 36000 // 10 hours
    })
});
app.use(sessionMiddleware);
// authentication middleware
(0, auth_2.configureAuthentication)(passport);
app.use(passport.initialize());
app.use(passport.session());
// ====================== CONFIGURE SOCKET.IO =========================== //
// instantiate the main socket.io server instance
const channelsIO = new socket_io_1.Server(httpServer, {
    path: "/channels",
    cors: {
        origin: "*",
    }
});
// convert express middleware to a socket middleware
const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);
// add session and authentication middlewares
channelsIO.use(wrap(sessionMiddleware));
channelsIO.use(wrap(passport.initialize()));
channelsIO.use(wrap(passport.session()));
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// connection event
channelsIO.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    let request = socket.request;
    // make sure a channel_id was passed and is a string
    let channel_id = socket.handshake.query.channel_id;
    if (!(0, utils_1.isString)(channel_id)) {
        socket.disconnect();
        return;
    }
    // if this is an authenticated request, make sure user who connected owns the channel
    if (request.isAuthenticated()) {
        // get user id
        let userID = request.session.passport.user;
        // get user's channels
    }
    // save channel ID in session for easy access in subsequent requests
    request.session.channelID = channel_id;
    // register event handlers
    socket.on("audioContent", (audioContent) => {
        console.log(request.session);
        // user must be authenticated to emit audio content
        if (request.isUnauthenticated()) {
            return;
        }
        return ch.emitAudioContent(audioContent);
    });
    // notify client that they can start sending requests
    socket.emit("connected");
}));
// ====================== CONFIGURE DATABASE ============================ //
db.connect(process.env.DB_URI || "")
    .then(() => {
    console.log("connected to MongoDB...");
})
    .catch((err) => {
    console.log("Connection error: " + err);
    process.exit();
});
// =========================== ROUTERS ================================ //
// account endpoints
app.post("/signup", auth_1.postSignup);
app.post("/login", auth_1.postLogin);
app.get("/login", auth_1.getLogin);
// channel endpoints
app.post("/accounts/:radioHostId/channels", ch.createChannel);
app.get("/accounts/:radioHostId/channels", ch.getChannels);
app.post("/channels/:radioChannelId", ch.emitAudioContent);
app.get("channels/:radioChannelId", ch.consumeAudioContent);
app.get("/", ch.getAllChannels);
// =========================== START SERVER ================================ //
// error handling middleware must be defined last
app.use(error_1.errorHandler);
const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
httpServer.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
});
