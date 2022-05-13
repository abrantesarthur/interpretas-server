'use strict';

// load configuration variables from .env file
require('dotenv').config();

// import server libraries
import express = require('express');
import http = require('http');

// import server middlewares
import bodyParser = require('body-parser');
import session = require('express-session');

// import endpoint handlers
import { login, signup } from './accounts';
import * as ch from "./channels"

// other imports
import {v4 as uuid} from 'uuid';
const SessionFileStore = require('session-file-store')(session);

// ====================== CONFIGURE SERVER ============================ //

// instantiate the express server
const app = express();
const server = http.createServer(app);

// json middleware
app.use(bodyParser.json())
// session middleware
app.use(session({
  // the function that generates unique session ids
  genid: (req) => {
    console.log("\ninside the middleware");
    console.log(req.sessionID);
    return uuid();
  },
  // the secret used to sign the session ID cookie
  secret: process.env.SESSION_SECRET || "keyboard cat",
  // don't force the session to be saved back to the store
  resave: false,
  // force a session that is uninitialized to be saved to the store
  saveUninitialized: true,
  // save sessions in files in `./sessions` folder instead of memory
  // this way, we don't lose session when the server crashes
  store: new SessionFileStore(),
}))

// =========================== ROUTERS ================================ //


// account endpoints
app.post("/signup", signup);
// app.post("/login", login);
app.get("/login", login);

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
})
