import { RequestHandler } from "express";
import passport = require("passport");
import {Error, ErrorType} from "../error";
import { validateArgument } from "../utils";
import { RadioHost } from "../models/radioHost";
import * as bcrypt from 'bcrypt';
import { assert } from "console";


// ==================== DEFINE HANDLERS ====================== //

// TODO: refactor database saving logic. The nesting here is ugly
const postSignup : RequestHandler = async (req, res, next) => {
    // validate argument
    try {
        validateArgument(
            req.body,
            ["name", "email", "password"],
            ["string", "string", "string"],
            [true, true, true]
        );    
    } catch(e) {
        return next(e);
    }
    
    // make sure radio host hasn't already signed up
    const radioHost = await RadioHost.findOne({
        email: req.body.email
    })
    .exec();
    
    if(radioHost) {
        return next(new Error(
            422,
            ErrorType.INVALID_PARAMETER,
            "email '" + req.body.email + "' already in use"
        ));
    }

    // save radioHost on database
    assert(req.body.password !== undefined);
    assert(req.body.password !== null);
    let password : string = req.body.password || "";

    const rh = new RadioHost({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(password, 8)
    });
    const savedRadioHost = await rh.save();

    return res.end(JSON.stringify({account_id: savedRadioHost["_id"]}));
}

const postLogin : RequestHandler = (req, res, next) => {
    // validate argument
    try {
        validateArgument(
            req.body,
            ["email", "password"],
            ["string", "string"],
            [true, true]
        );    
    } catch(e) {
        return next(e);
    }

    // passport.authenticate() invokes the local strategy defined in index.ts to
    // validate the 'email' and 'password' passed as part of this request.
    passport.authenticate('local', (err: any, user: any) => {
        // if local strategy returned error, call error handling middleware
        if(err) return next(err);
 
        // if the 'email' and 'password' are successfully validated by the local
        // strategy in index.ts, calling req.login() will invoke passport.serializeUser(),
        // defined in auth.ts, which, in turn, saves user info in the session.
        // Then, the callback passed here is invoked.
        req.login(user, (err) => {
            // if passport.serializeUser returned an error, call error handling middleware
            if(err) {
                let e : Error = {
                    code: 500,
                    type: ErrorType.INTERNAL_ERROR,
                    message: 'something wrong happened. Try again later',
                };
                return next(e);
            }
            
            return res.send(JSON.stringify({
                id: user._id,
                name: user.name,
                email: user.email,
            }));
        })
    })(req, res, next);
}


// ==================== EXPORT HANDLERS ====================== //

export {postSignup, postLogin};