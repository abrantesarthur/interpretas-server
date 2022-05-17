import * as mongoose from 'mongoose';

export const RadioChannel = mongoose.model(
    "RadioChannel",
    new mongoose.Schema({
        radio_host_id: {type: mongoose.SchemaTypes.ObjectId, ref: "RadioHost"},
        name: String,
    })
);