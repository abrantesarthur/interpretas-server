import {PassportStatic} from 'passport';
import passportStrategy = require('passport-local');
const PassportLocalStrategy = passportStrategy.Strategy;
import { Error, ErrorType } from './error';

// TODO: replace this by a database
const users = [
    {
      id: 'dgniaogn-sgnn2ng-gnas',
      email: 'test@test.com',
      password: 'password'
    }
];

export const configureAuthentication = (passport: PassportStatic) => {
    
    // configure passport authentication middleware to use local strategy (i.e., email + password)
    // the 'verify' function (i.e., secong argument to PassportLocalStrategy) is called whenever
    // we invoke passport.authenticate() (see postLogin() handler in accounts.ts)
    passport.use(new PassportLocalStrategy(
        // alias username to 'email'
        {usernameField: 'email'},
        (email, password, done) => {
        // TODO: query from database
        const user = users[0];
    
        // if email is invalid, return error to passport.authenticate()
        if(email !== user.email) {
            let err : Error = {
            code: 422,
            type: ErrorType.INVALID_PARAMETER,
            message: '"email" is invalid'
            }
            return done(err);
        }
    
        // if password is invalid, return error to passport.authenticate()
        if(password !== user.password) {
            let err : Error = {
            code: 422,
            type: ErrorType.INVALID_PARAMETER,
            message: '"password" is invalid'
            }
            return done(err);
        }
    
        // implicitly add a login() method to 'req' and return 'user' to passport.authenticate()
        return done(null, user);
        }
    ))
    
    // Tell passport how to serialize the user. this is invoked by req.login()
    // if passport.authentication() is successful. It adds user information to
    // the session store and to the 'req' object
    passport.serializeUser((user: any, done) => {
        process.nextTick(() => {
            done(null, user.id);
        })
    })
    
    // Tell passport how to deserialize the user. This is invoked when the 
    // client sends a request with a session information. It matches the
    // session id sent in the request to the session id in the session store.
    // If success, it passes it to the callback function, so we can retrieve
    // the remaining user info from our database.
    passport.deserializeUser((id, done) => {
        // TODO: get user from database
        const user = users[0].id === id ? users[0] : false;

        if(user === false) {
            let err : Error = {
            code: 401,
            type: ErrorType.REQUEST_DENIED,
            message: 'client is not authenticated'
            }
            done(err);
        } else {
            done(null, user);
        }

    })
}
  

