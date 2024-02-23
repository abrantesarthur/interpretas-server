import * as mongoose from 'mongoose';

export const RadioHost = mongoose.model(
    "RadioHost",
    new mongoose.Schema({
        name: {type: String, required: true},
        email: {type: String, required: true},
        password: {type: String, required: true}
    })
);

