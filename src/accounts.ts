import { RequestHandler } from "express";
import passport = require("passport");


// ==================== DEFINE HANDLERS ====================== //

const signup : RequestHandler = (req, res) => {
    res.end("\nsignup");
}

const getLogin : RequestHandler = (req, res) => {
    res.end("\ngetLogin\n");
}

const postLogin : RequestHandler = (req, res, next) => {
    console.log("inside POST /login callback");
    console.log(req.sessionID);

    // passport.authenticate() invokes the local strategy defined in index.ts to
    // validate the 'email' and 'password' passed as part of this request.
    passport.authenticate('local', (err, user, info) => {
        console.log("inside passport.authenticate()");
        console.log(`req.user: ${JSON.stringify(req.user)}`)
        
        // if the 'email' and 'password' are successfully validated by the local
        // strategy in index.ts, calling req.login() will invoke passport.serializeUser(),
        // defined in index.ts, which, in turn, saves user info in the session.
        // Then, the callback passed here is invoked.
        req.login(user, (err) => {
            console.log("inside req.login() callback");
            console.log(`req.user: ${JSON.stringify(req.user)}`)
            return res.send("You are authenticated and logged in!\n");
        })
    })(req, res, next);
}


// ==================== EXPORT HANDLERS ====================== //

export {signup, getLogin, postLogin};