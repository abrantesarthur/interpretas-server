import * as mongoose from 'mongoose';

export const RadioChannel = mongoose.model(
    "radioChannel",
    new mongoose.Schema({
        radio_host_id: String,
        name: String,
    })
);