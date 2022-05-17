import { RequestHandler } from "express";
import passport = require("passport");
import {Error, ErrorType} from "../error";
import { validateArgument } from "../utils";
import { Host } from "../models/host";
import * as bcrypt from 'bcrypt';
import { assert } from "console";


// ==================== DEFINE HANDLERS ====================== //

// TODO: split signup between host and other types of users
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
    
    // make sure host hasn't already signed up
    Host.findOne({
        email: req.body.email
    })
    .exec(async (err, host) => {
        if(err) {
            return next(new Error(
                500,
                ErrorType.INTERNAL_ERROR,
                "something wrong happened"
            ));
        }

        if(host) {
            return next(new Error(
                422,
                ErrorType.INVALID_PARAMETER,
                "email '" + req.body.email + "' already in use"
            ));
        }

        // save host on database
        assert(req.body.password !== undefined);
        assert(req.body.password !== null);
        let password : string = req.body.password || "";

        const h = new Host({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(password, 8)
        });
        await h.save((err: any, host: any) => {
            if(err) {
                return next(new Error(
                    500,
                    ErrorType.INTERNAL_ERROR,
                    "something wrong happened"
                ));
            }
            
            return res.end(JSON.stringify({account_id: host["_id"]}));
        })
    })    
}

const getLogin : RequestHandler = (req, res) => {
    res.end("\ngetLogin\n");
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
    passport.authenticate('local', (err, user, _) => {
        // if local strategy returned error, call error handling middleware
        if(err) return next(err);
 
        // if the 'email' and 'password' are successfully validated by the local
        // strategy in index.ts, calling req.login() will invoke passport.serializeUser(),
        // defined in index.ts, which, in turn, saves user info in the session.
        // Then, the callback passed here is invoked.
        // TODO: handle error case.
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
            
            // TODO: consider redirecting instead
            return res.send("You are authenticated and logged in!\n");
        })
    })(req, res, next);
}


// ==================== EXPORT HANDLERS ====================== //

export {postSignup, getLogin, postLogin};