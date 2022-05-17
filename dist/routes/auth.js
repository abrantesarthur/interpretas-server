"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postLogin = exports.getLogin = exports.postSignup = void 0;
const passport = require("passport");
const error_1 = require("../error");
const utils_1 = require("../utils");
const host_1 = require("../models/host");
const bcrypt = require("bcrypt");
const console_1 = require("console");
// ==================== DEFINE HANDLERS ====================== //
// TODO: split signup between host and other types of users
// TODO: refactor database saving logic. The nesting here is ugly
const postSignup = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // validate argument
    try {
        (0, utils_1.validateArgument)(req.body, ["name", "email", "password"], ["string", "string", "string"], [true, true, true]);
    }
    catch (e) {
        return next(e);
    }
    // make sure host hasn't already signed up
    host_1.Host.findOne({
        email: req.body.email
    })
        .exec((err, host) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            return next(new error_1.Error(500, error_1.ErrorType.INTERNAL_ERROR, "something wrong happened"));
        }
        if (host) {
            return next(new error_1.Error(422, error_1.ErrorType.INVALID_PARAMETER, "email '" + req.body.email + "' already in use"));
        }
        // save host on database
        (0, console_1.assert)(req.body.password !== undefined);
        (0, console_1.assert)(req.body.password !== null);
        let password = req.body.password || "";
        const h = new host_1.Host({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(password, 8)
        });
        yield h.save((err, host) => {
            if (err) {
                return next(new error_1.Error(500, error_1.ErrorType.INTERNAL_ERROR, "something wrong happened"));
            }
            return res.end(JSON.stringify({ account_id: host["_id"] }));
        });
    }));
});
exports.postSignup = postSignup;
const getLogin = (req, res) => {
    res.end("\ngetLogin\n");
};
exports.getLogin = getLogin;
const postLogin = (req, res, next) => {
    // validate argument
    try {
        (0, utils_1.validateArgument)(req.body, ["email", "password"], ["string", "string"], [true, true]);
    }
    catch (e) {
        return next(e);
    }
    // passport.authenticate() invokes the local strategy defined in index.ts to
    // validate the 'email' and 'password' passed as part of this request.
    passport.authenticate('local', (err, user, _) => {
        // if local strategy returned error, call error handling middleware
        if (err)
            return next(err);
        // if the 'email' and 'password' are successfully validated by the local
        // strategy in index.ts, calling req.login() will invoke passport.serializeUser(),
        // defined in index.ts, which, in turn, saves user info in the session.
        // Then, the callback passed here is invoked.
        // TODO: handle error case.
        req.login(user, (err) => {
            // if passport.serializeUser returned an error, call error handling middleware
            if (err) {
                let e = {
                    code: 500,
                    type: error_1.ErrorType.INTERNAL_ERROR,
                    message: 'something wrong happened. Try again later',
                };
                return next(e);
            }
            // TODO: consider redirecting instead
            return res.send("You are authenticated and logged in!\n");
        });
    })(req, res, next);
};
exports.postLogin = postLogin;
