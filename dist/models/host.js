"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Host = void 0;
const mongoose = require("mongoose");
exports.Host = mongoose.model("Host", new mongoose.Schema({
    name: String,
    email: String,
    password: String,
}));
