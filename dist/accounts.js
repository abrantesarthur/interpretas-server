"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
// ==================== DEFINE HANDLERS ====================== //
const signup = (req, res) => {
    res.end("\nsignup");
};
exports.signup = signup;
const login = (req, res) => {
    console.log("\ninside login");
    console.log(req.sessionID);
    res.end("\nlogin");
};
exports.login = login;
