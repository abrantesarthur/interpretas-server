'use strict';
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
const auth_1 = require("./routes/auth");
const ch = require("./routes/channels");
// import database
// TODO: consider moving db out of mongoDB Atlas
const db = require("mongoose");
// other imports
const uuid_1 = require("uuid");
const error_1 = require("./error");
const auth_2 = require("./auth");
const passport = require("passport");
// ==================== CONFIGURE HTTP SERVER ========================== //
// instantiate the http server
const app = express();
const httpServer = http.createServer(app);
// instantiate the socket.io server
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
    }
});
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
// convert express middleware to a socket middleware
const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);
// add session and authentication middlewares
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));
io.on("connection", (socket) => {
    console.log("received connection");
    let request = socket.request;
    if (request.isAuthenticated()) {
        console.log("is authenticated");
    }
    else {
        console.log("is not authenticated");
    }
    console.log(request.session);
    // socket.disconnect()
});
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
app.post("/accounts/:radioHostId/channels", ch.getChannels);
app.post("/channels/:radioChannelId", ch.emitContent);
app.get("channels/:radioChannelId", ch.consumeContent);
app.get("/", ch.getAllChannels);
// =========================== START SERVER ================================ //
// error handling middleware must be defined last
app.use(error_1.errorHandler);
const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
httpServer.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
});
