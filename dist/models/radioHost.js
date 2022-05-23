"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadioHost = void 0;
const mongoose = require("mongoose");
exports.RadioHost = mongoose.model("RadioHost", new mongoose.Schema({
    name: String,
    email: String,
    password: String,
}));
