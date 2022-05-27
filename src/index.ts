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
import {postLogin, postSignup } from './handlers/auth';
import * as ch from './handlers/channels';

// import database
// TODO: consider moving db out of mongoDB Atlas
import * as db from 'mongoose';

// other imports
import {v4 as uuid} from 'uuid';
import { errorHandler } from './error';
import {configureAuthentication} from './config/auth';
import {configureSocketConnection} from './config/socket';
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

// configure connection event
channelsIO.on("connection", configureSocketConnection)

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

// channel endpoints
app.post("/accounts/:radioHostId/channels", ch.createChannel);
app.get("/accounts/:radioHostId/channels", ch.getChannelsByHostId);
app.get("/getChannels", ch.getAllChannels);
app.get("/getChannel/:channelId", ch.getChannelById)

// pages endpoints
app.get("/", (_, res) => {
  return res.sendFile(__dirname + "/html/home.html");
});
app.get("/channel/:channelId", (_, res) => {
  return res.sendFile(__dirname + "/html/channel.html");
});

// =========================== START SERVER ================================ //

// error handling middleware must be defined last
app.use(errorHandler)

const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
httpServer.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
})
