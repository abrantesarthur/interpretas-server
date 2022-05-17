import * as mongoose from 'mongoose';

export const Host = mongoose.model(
    "Host",
    new mongoose.Schema({
        name: String,
        email: String,
        password: String,
    })
);

