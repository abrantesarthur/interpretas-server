import * as mongoose from 'mongoose';

export const Channel = mongoose.model(
    "channel",
    new mongoose.Schema({
        name: String,
        email: String,
        password: String,
    })
);