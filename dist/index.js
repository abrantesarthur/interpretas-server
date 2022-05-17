'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// load configuration variables from .env file
require('dotenv').config();
// import server libraries
const express = require("express");
const http = require("http");
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
// ====================== CONFIGURE SERVER ============================ //
// instantiate the express server
const app = express();
const server = http.createServer(app);
// json middleware
app.use(bodyParser.json());
// session middleware
app.use(session({
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
}));
// authentication middleware
(0, auth_2.configureAuthentication)(passport);
app.use(passport.initialize());
app.use(passport.session());
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
app.post("/accounts/:accountId/channels", ch.createChannel);
app.post("/channels/:channelId", ch.emitContent);
app.get("channels/:channelId", ch.consumeContent);
app.get("/", ch.getChannels);
// =========================== START SERVER ================================ //
// error handling middleware must be defined last
app.use(error_1.errorHandler);
const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
server.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
});
