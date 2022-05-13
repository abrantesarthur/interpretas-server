"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
// ==================== DEFINE HANDLERS ====================== //
const signup = (req, res) => {
    res.end("\nsignup");
};
exports.signup = signup;
const login = (req, res) => {
    res.end("\nlogin");
};
exports.login = login;
