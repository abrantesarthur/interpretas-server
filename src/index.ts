'use strict';

// load configuration variables from .env file
require('dotenv').config();

// import server libraries
import express = require('express');
import http = require('http');
import {Server} from 'socket.io';

// import server middlewares
import bodyParser = require('body-parser');
import session = require('express-session');
import sessionFileStore = require('session-file-store');
const SessionFileStore = sessionFileStore(session);

// import endpoint handlers
import { getLogin, postLogin, postSignup } from './handlers/auth';
import * as ch from './handlers/channels';

// import database
// TODO: consider moving db out of mongoDB Atlas
import * as db from 'mongoose';

// other imports
import {v4 as uuid} from 'uuid';
import { errorHandler } from './error';
import {configureAuthentication} from './auth';
import passport = require('passport');
import {isString} from "./utils";

// ====================== CONFIGURE SESSIONS =========================== //

// use typescript's Declaration Merging to extend optional session properties
declare module 'express-session' {
  interface SessionData {
      channelID: string;
      passport: any;
      firstRequest: boolean;
  }
}


// ==================== CONFIGURE HTTP SERVER ========================== //

// instantiate the http server
const app = express();
const httpServer = http.createServer(app);

// json middleware
app.use(bodyParser.json())

// session middleware
const sessionMiddleware = session({
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
});
app.use(sessionMiddleware);

// authentication middleware
configureAuthentication(passport);
app.use(passport.initialize());
app.use(passport.session());


// ====================== CONFIGURE SOCKET.IO =========================== //

// instantiate the main socket.io server instance
const channelsIO = new Server(httpServer, {
  path: "/channels",
  cors: {
    origin: "*",
  }
});

// convert express middleware to a socket middleware
const wrap = (middleware: any) => (socket:any, next:any) => middleware(socket.request, {}, next);

// add session and authentication middlewares
channelsIO.use(wrap(sessionMiddleware));
channelsIO.use(wrap(passport.initialize()));
channelsIO.use(wrap(passport.session()));

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

// connection event
channelsIO.on("connection", async (socket) => {
  let request = socket.request as express.Request;

  // make sure a channel_id was passed and is a string
  let channel_id = socket.handshake.query.channel_id;

  if(!isString(channel_id) || channel_id.length == 0) {
    socket.disconnect();
    return;
  }

  // if this is an authenticated request, make sure user who connected owns the channel
  if(request.isAuthenticated()) {
    // get user id
    // let userID = request.session.passport.user;

    // TODO get user's channels and make sure he's the owner

    // set flag to true, so we handle translation API semantics correctly
    request.session.firstRequest = true;
  }

  // subscribe socket to the channel
  socket.join(channel_id);

  // save channel ID in session for easy access in subsequent events
  request.session.channelID = channel_id;

  // register event handlers
  socket.on("audioContent", (audioContent) => ch.emitAudioContent(audioContent, socket));

  // notify client that they can start sending requests
  socket.emit("connected");
})


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
app.post("/signup", postSignup);
app.post("/login", postLogin);
app.get("/login", getLogin);

// channel endpoints
app.post("/accounts/:radioHostId/channels", ch.createChannel);
app.get("/accounts/:radioHostId/channels", ch.getChannels);
app.get("channels/:radioChannelId", ch.consumeAudioContent);
app.get("/", ch.getAllChannels);

// =========================== START SERVER ================================ //

// error handling middleware must be defined last
app.use(errorHandler)

const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
httpServer.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
})
