'use strict';

// load configuration variables from .env file
require('dotenv').config();

// import server libraries
import express = require('express');
import http = require('http');

// import server middlewares
import bodyParser = require('body-parser');
import session = require('express-session');
const SessionFileStore = require('session-file-store')(session);
import passport = require('passport');
import passportStrategy = require('passport-local');
const PassportLocalStrategy = passportStrategy.Strategy;

// import endpoint handlers
import { getLogin, postLogin, signup } from './accounts';
import * as ch from "./channels"

// other imports
import {v4 as uuid} from 'uuid';

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
    console.log("\ninside session middleware genid()");
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
  // TODO: consider using a database as a store (e.g., connect-sqlite3) (see http://www.passportjs.org/tutorials/password/session/)
  store: new SessionFileStore(),
}))


// TODO: replace this by a database
const users = [
  {
    id: 'dgniaogn-sgnn2ng-gnas',
    email: 'test@test.com',
    password: 'password'
  }
];

// configure passport authentication middleware to use local strategy (i.e., email + password)
// the 'verify' function (i.e., secong argument to PassportLocalStrategy) is called whenever
// we invoke passport.authenticate() (see postLogin() handler in accounts.ts)
passport.use(new PassportLocalStrategy(
  {usernameField: 'email'},
  (email, password, done) => {
    console.log('inside PassportLocalStrategy callback');
    // TODO: query database
    const user = users[0];

    // TODO: standardize error type in a utils file or something
    if(email !== user.email) {
      return done({
        "code": "422",
        "type": "INVALID_PARAMETER",
        "message": "'email' is invalid"
      });
    }

    if(password !== user.password) {
      return done({
        "code": "422",
        "type": "INVALID_PARAMETER",
        "message": "'password' is invalid"
      });
    }

    // success: implicitly add a login() method to req object
    // and return the user object to passport.authenticate()
    return done(null, user);
  }
))

// Tell passport how to serialize the user. this is invoked by req.login()
// if passport.authentication() is successful. It adds user information to
// the session store and to the 'req' object
passport.serializeUser((user: any, done) => {
  console.log('Inside passport.serializeUser(). user id is save to the session file store here');
  process.nextTick(() => {
    done(null, user.id);
  })
})

// authentication middleware
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

const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
server.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
})
