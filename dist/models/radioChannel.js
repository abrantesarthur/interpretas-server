"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadioChannel = void 0;
const mongoose = require("mongoose");
exports.RadioChannel = mongoose.model("RadioChannel", new mongoose.Schema({
    radio_host_id: { type: mongoose.SchemaTypes.ObjectId, ref: "RadioHost" },
    name: String,
}));
