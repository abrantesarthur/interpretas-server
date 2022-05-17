"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.Error = exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
    ErrorType["INVALID_PARAMETER"] = "INVALID_PARAMETER";
    ErrorType["INVALID_REQUEST"] = "INVALID_REQUEST";
    ErrorType["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorType["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorType["NOT_FOUND"] = "NOT_FOUND";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
class Error {
    constructor(code, type, message) {
        this.code = code;
        this.type = type;
        this.message = message;
    }
}
exports.Error = Error;
const errorHandler = (err, _req, res, _next) => {
    res.status(err.code).send(err);
};
exports.errorHandler = errorHandler;
