"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postLogin = exports.getLogin = exports.signup = void 0;
const passport = require("passport");
const error_1 = require("./error");
// ==================== DEFINE HANDLERS ====================== //
const signup = (req, res) => {
    res.end("\nsignup");
};
exports.signup = signup;
const getLogin = (req, res) => {
    res.end("\ngetLogin\n");
};
exports.getLogin = getLogin;
const postLogin = (req, res, next) => {
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
