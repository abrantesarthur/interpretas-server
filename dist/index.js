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
const SessionFileStore = require('session-file-store')(session);
const passport = require("passport");
const passportStrategy = require("passport-local");
const PassportLocalStrategy = passportStrategy.Strategy;
// import endpoint handlers
const accounts_1 = require("./accounts");
const ch = require("./channels");
// other imports
const uuid_1 = require("uuid");
const error_1 = require("./error");
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
        console.log("\nInside session middleware genid()");
        console.log("session id: " + req.sessionID);
        return (0, uuid_1.v4)();
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
}));
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
// alias username to 'email'
{ usernameField: 'email' }, (email, password, done) => {
    // TODO: query database
    const user = users[0];
    // TODO: standardize error type in a utils file or something
    if (email !== user.email) {
        let err = {
            code: 422,
            type: error_1.ErrorType.INVALID_PARAMETER,
            message: '"email" is invalid'
        };
        return done(err);
    }
    if (password !== user.password) {
        let err = {
            code: 422,
            type: error_1.ErrorType.INVALID_PARAMETER,
            message: '"password" is invalid'
        };
        return done(err);
    }
    let err = {
        code: 422,
        type: error_1.ErrorType.INVALID_PARAMETER,
        message: '"password" is invalid'
    };
    return done(err);
    // success: implicitly add a login() method to req object
    // and return the user object to passport.authenticate()
    return done(null, user);
}));
// Tell passport how to serialize the user. this is invoked by req.login()
// if passport.authentication() is successful. It adds user information to
// the session store and to the 'req' object
passport.serializeUser((user, done) => {
    console.log('Inside passport.serializeUser(). user id is save to the session file store here');
    process.nextTick(() => {
        done(null, user);
    });
});
// Tell passport how to deserialize the user. This is invoked when the 
// client sends a request with a session information. It matches the
// session id sent in the request to the session id in the session store.
// If success, it passes it to the callback function, so we can retrieve
// the remaining user info from our database.
passport.deserializeUser((id, done) => {
    console.log('Inside deserializeUser callback');
    console.log(`The user id passport saved in the session file store is: ${id}`);
    const user = users[0].id === id ? users[0] : false;
    console.log(user);
    done(null, user);
});
// authentication middleware
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
app.use((err, req, res, next) => {
    res.status(err.code).send(err);
});
const port = Number(process.env.PORT);
const hostname = process.env.HOSTNAME;
server.listen(port, hostname, () => {
    console.log(`server running on http://${hostname}:${port}/`);
});
