"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
    ErrorType["INVALID_PARAMETER"] = "INVALID_PARAMETER";
    ErrorType["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorType["REQUEST_DENIED"] = "REQUEST_DENIED";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
const errorHandler = (err, _req, res, _next) => {
    res.status(err.code).send(err);
};
exports.errorHandler = errorHandler;
