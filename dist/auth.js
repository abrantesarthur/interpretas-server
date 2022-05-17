"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureAuthentication = void 0;
const passportStrategy = require("passport-local");
const PassportLocalStrategy = passportStrategy.Strategy;
const error_1 = require("./error");
const host_1 = require("./models/host");
const bcrypt = require("bcrypt");
const configureAuthentication = (passport) => {
  // configure passport authentication middleware to use local strategy (i.e., email + password)
  // the 'verify' function (i.e., secong argument to PassportLocalStrategy) is called whenever
  // we invoke passport.authenticate() (see postLogin() handler in accounts.ts)
  passport.use(
    new PassportLocalStrategy(
      // alias username to 'email'
      { usernameField: "email" },
      (email, password, done) => {
        // look for user on database
        host_1.Host.findOne({
          email: email,
        }).exec((err, user) => {
          if (err) {
            return done(
              new error_1.Error(
                500,
                error_1.ErrorType.INTERNAL_ERROR,
                "something wrong happened"
              )
            );
          }
          // if account is not found, return error to passport.authenticate()
          if (!user) {
            return done(
              new error_1.Error(
                404,
                error_1.ErrorType.NOT_FOUND,
                "could not find account with email '" + email + "'"
              )
            );
          }
          // if password is invalid, return error to passport.authenticate()
          if (!bcrypt.compareSync(password, user.password)) {
            return done(
              new error_1.Error(
                422,
                error_1.ErrorType.INVALID_PARAMETER,
                '"password" is invalid'
              )
            );
          }
          // implicitly add a login() method to 'req' and return 'user' to passport.authenticate()
          return done(null, user);
        });
      }
    )
  );
  // Tell passport how to serialize the user. this is invoked by req.login()
  // if passport.authentication() is successful. It adds user information to
  // the session store and to the 'req' object
  passport.serializeUser((user, done) => {
    process.nextTick(() => {
      done(null, user._id);
    });
  });
  // Tell passport how to deserialize the user. This is invoked when the
  // client sends a request with a session information. It matches the
  // session id sent in the request to the session id in the session store.
  // If success, it passes it to the callback function, so we can retrieve
  // the remaining user info from our database.
  passport.deserializeUser((id, done) => {
    //  get user from database
    host_1.Host.findById(id).exec((err, user) => {
      if (err) {
        return done(
          new error_1.Error(
            500,
            error_1.ErrorType.INTERNAL_ERROR,
            "something wrong happened"
          )
        );
      }
      if (!user) {
        return done(
          new error_1.Error(
            401,
            error_1.ErrorType.REQUEST_DENIED,
            "client is not authenticated"
          )
        );
      }
      done(null, user);
    });
  });
};
exports.configureAuthentication = configureAuthentication;
