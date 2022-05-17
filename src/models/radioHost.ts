import * as mongoose from 'mongoose';

export const RadioHost = mongoose.model(
    "radio_host",
    new mongoose.Schema({
        name: String,
        email: String,
        password: String,
    })
);

