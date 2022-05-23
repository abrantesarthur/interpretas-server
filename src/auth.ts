import {PassportStatic} from 'passport';
import passportStrategy = require('passport-local');
const PassportLocalStrategy = passportStrategy.Strategy;
import { Error, ErrorType } from './error';
import { RadioHost } from './models/radioHost';
import * as bcrypt from 'bcrypt';

export const configureAuthentication = (passport: PassportStatic) => {
    
    // configure passport authentication middleware to use local strategy (i.e., email + password)
    // the 'verify' function (i.e., secong argument to PassportLocalStrategy) is called whenever
    // we invoke passport.authenticate() (see postLogin() handler in accounts.ts)
    passport.use(new PassportLocalStrategy(
        // alias username to 'email'
        {usernameField: 'email'},
        (email, password, done) => {

            // look for user on database
            RadioHost.findOne({
                email: email
            }).exec((err, radioHost: any) => {
                if(err) {
                    return done(new Error(
                        500,
                        ErrorType.INTERNAL_ERROR,
                        "something wrong happened"
                    ));
                }

                // if account is not found, return error to passport.authenticate()
                if(!radioHost) {
                    return done(new Error(
                        404,
                        ErrorType.NOT_FOUND,
                        "could not find account with email '" + email + "'",
                    ));
                }

                // if password is invalid, return error to passport.authenticate()
                if(!bcrypt.compareSync(password, radioHost.password)) {
                    return done(new Error(
                        422,
                        ErrorType.INVALID_PARAMETER,
                        '"password" is invalid'
                    ));
                }

                // implicitly add a login() method to 'req' and return 'radioHost' to passport.authenticate()
                return done(null, radioHost);
            })
        }
    ))
    
    // Tell passport how to serialize the user. this is invoked by req.login()
    // if passport.authentication() is successful. It adds user information to
    // the session store and to the 'req' object
    passport.serializeUser((user: any, done) => {
        process.nextTick(() => {
            done(null, user._id);
        })
    })
    
    // Tell passport how to deserialize the user. This is invoked when the 
    // client sends a request with a session information. It matches the
    // session id sent in the request to the session id in the session store.
    // If success, it passes it to the callback function, so we can retrieve
    // the remaining user info from our database.
    passport.deserializeUser((id, done) => {
        //  get user from database
        RadioHost.findById(id).exec((err, radioHost) => {
            if(err) {
                return done(new Error(
                    500,
                    ErrorType.INTERNAL_ERROR,
                    "something wrong happened"
                ));
            }

            if(!radioHost) {
                return done(new Error(
                    401,
                    ErrorType.UNAUTHORIZED,
                    'client is not authenticated'
                ));
            }

            done(null, radioHost);
        })
    })
}
  

