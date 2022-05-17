'use strict';

// load configuration variables from .env file
require('dotenv').config();

// import server libraries
import express = require('express');
import http = require('http');

// import server middlewares
import bodyParser = require('body-parser');
import session = require('express-session');
import sessionFileStore = require('session-file-store');
const SessionFileStore = sessionFileStore(session);

// import endpoint handlers
import { getLogin, postLogin, signup } from './accounts';
import { MongoClient } from 'mongodb';


// import database
import * as db from 'mongodb';

// other imports
import {v4 as uuid} from 'uuid';
import { errorHandler } from './error';
import {configureAuthentication} from './auth';
import passport = require('passport');

// ====================== CONFIGURE SERVER ============================ //

// instantiate the express server
const app = express();
const server = http.createServer(app);

// json middleware
app.use(bodyParser.json())

// session middleware
app.use(session({
  // the function that generates unique session ids
  genid: (_) => uuid(),
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
    ttl: 36000  // 10 hours
  })
}))

// authentication middleware
configureAuthentication(passport);
app.use(passport.initialize());
app.use(passport.session());

// =========================== ROUTERS ================================ //

// account endpoints
app.post("/signup", signup);
app.post("/login", postLogin);
app.get("/login", getLogin);

// channel endpoints
app.post("/accounts/:accountId/channels", ch.createChannel);
app.post("/channels/:channelId", ch.emitContent);
app.get("channels/:channelId", ch.consumeContent);
app.get("/", ch.getChannels);

// =========================== START SERVER ================================ //

// error handling middleware must be defined last
app.use(errorHandler)

const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
server.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
})
