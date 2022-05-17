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
const accounts_1 = require("./accounts");
const ch = require("./channels");
// other imports
const uuid_1 = require("uuid");
const error_1 = require("./error");
const auth_1 = require("./auth");
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
    // don't force the session to be saved back to the store
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
(0, auth_1.configureAuthentication)(passport);
app.use(passport.initialize());
app.use(passport.session());
// =========================== ROUTERS ================================ //
// account endpoints
app.post("/signup", accounts_1.signup);
app.post("/login", accounts_1.postLogin);
app.get("/login", accounts_1.getLogin);
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
