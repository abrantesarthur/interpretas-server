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
// import endpoint handlers
const accounts_1 = require("./accounts");
const ch = require("./channels");
// other imports
const uuid_1 = require("uuid");
const SessionFileStore = require('session-file-store')(session);
// ====================== CONFIGURE SERVER ============================ //
// instantiate the express server
const app = express();
const server = http.createServer(app);
// json middleware
app.use(bodyParser.json());
// session middleware
app.use(session({
    // the function that generates unique session ids
    genid: (req) => {
        console.log("\ninside the middleware");
        console.log(req.sessionID);
        return (0, uuid_1.v4)();
    },
    // the secret used to sign the session ID cookie
    secret: process.env.SESSION_SECRET || "keyboard cat",
    // don't force the session to be saved back to the store
    resave: false,
    // force a session that is uninitialized to be saved to the store
    saveUninitialized: true,
    // save session ids in a file instead of memory so we don't lose session
    // information when reinitializing the server
    store: new SessionFileStore(),
}));
// =========================== ROUTERS ================================ //
// account endpoints
app.post("/signup", accounts_1.signup);
// app.post("/login", login);
app.get("/login", accounts_1.login);
// channel endpoints
app.post("/accounts/:accountId/channels", ch.createChannel);
app.post("/channels/:channelId", ch.emitContent);
app.get("channels/:channelId", ch.consumeContent);
app.get("/", ch.getChannels);
// =========================== START SERVER ================================ //
const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
server.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
});
