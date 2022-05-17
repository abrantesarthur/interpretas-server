import * as mongoose from 'mongoose';

export const RadioHost = mongoose.model(
    "RadioHost",
    new mongoose.Schema({
        name: String,
        email: String,
        password: String,
    })
);

