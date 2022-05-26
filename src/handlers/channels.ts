import { SpeechTranslationServiceClient } from '@google-cloud/media-translation';
import { RequestHandler } from 'express';
import { Socket } from 'socket.io';
import { Error, ErrorType } from '../error';
import { RadioChannel } from '../models/radioChannel';
import { RadioHost } from '../models/radioHost';
import { validateArgument } from '../utils';
import express = require('express');


// ================ CONFIGURE MEDIA TRANSLATION API ================== //
  
// Creates a client
const client = new SpeechTranslationServiceClient();

// Create a recognize stream
const stream = client.streamingTranslateSpeech();

// ======================== DEFINE HANDLERS ========================== //

const createChannel: RequestHandler = (req, res, next) => {

    // radio host must be authenticated
    // TODO: require that radio host specifically is authenticated
    if(req.isUnauthenticated()) {
        return next(new Error(
            401,
            ErrorType.UNAUTHORIZED,
            'client is not authenticated'
        ));
    }

    // validate arguments
    try {
        validateArgument(req.body, ["name"], ["string"], [true]);
    } catch(e) {
        return next(e);
    }

    // get radio host id from url params
    let radioHostId  = req.params.radioHostId;


    // make sure radio host exists
    RadioHost
        .findById(radioHostId)
        .exec((err, radioHost)  => {
            if(err) {
                return next(new Error(500, ErrorType.INTERNAL_ERROR, 'something wrong happened'));
            }

            if(!radioHost) {
                return next(new Error(
                    404,
                    ErrorType.NOT_FOUND,
                    'could not find radio host with id "' + radioHostId + '"'
                ));
            }


            // make sure channel does not exist on database
            RadioChannel
                .findOne({radio_host_id: radioHost._id, name: req.body.name})
                .exec(async (err, radioChannel) => {
                    if(err) {
                        return next(new Error(500, ErrorType.INTERNAL_ERROR, 'something wrong happened'));
                    }
                    
                    if(radioChannel) {
                        return next(new Error(
                            400,
                            ErrorType.INVALID_REQUEST,
                            'host with id "' + radioHost._id + '" already has a channel with name "' + req.body.name + '"'
                        ));
                    }


                    // create radio channel
                    const rc = new RadioChannel({
                        radio_host_id: radioHost._id,
                        name: req.body.name,
                    });

                    await rc.save((err: any, radioChannel: any) => {
                        if(err) {
                            return next(new Error(500, ErrorType.INTERNAL_ERROR, 'something wrong happened'));
                        }

                        return res.end(JSON.stringify({
                            id: radioChannel._id,
                            radio_host_id: radioHost._id,
                            name: radioChannel.name,
                        }))
                    })

            })
    })
}

const getChannels : RequestHandler = (req, res, next) => {    
    console.log("getChannels");
    // get radio host id from url params
    let radioHostId  = req.params.radioHostId;


    // make sure radio host exists
    RadioHost
        .findById(radioHostId)
        .exec((err, radioHost)  => {
            if(err) {
                return next(new Error(500, ErrorType.INTERNAL_ERROR, 'something wrong happened'));
            }

            if(!radioHost) {
                return next(new Error(
                    404,
                    ErrorType.NOT_FOUND,
                    'could not find radio host with id "' + radioHostId + '"'
                ));
            }


            // find channels
            RadioChannel
                .find({radio_host_id: radioHost._id})
                .exec((err, radioChannels) => {
                    if(err) {
                        return next(new Error(500, ErrorType.INTERNAL_ERROR, 'something wrong happened'));
                    }
                    
                    if(!radioChannels || radioChannels.length === 0) {
                        return next(new Error(
                            400,
                            ErrorType.INVALID_REQUEST,
                            'host with id "' + radioHost._id + '" has no channels'
                        ));
                    }

                    let channels : any[] = [];
                    radioChannels.forEach((rc) => {
                        channels.push({
                            "id": rc._id,
                            "radio_host_id": rc.radio_host_id,
                            "name": rc.name,
                        });
                    })

                    return res.end(JSON.stringify(channels));
            })
    })
}

const emitAudioContent = (audioContent: string, socket: Socket) => {
    let request = socket.request as express.Request;

    // user must be authenticated to emit audio content
    if(request.isUnauthenticated()) {
      return;
    }

    // make sure channel id is defined within the session
    if(request.session.channelID === undefined || request.session.channelID.length === 0) {
        return;
    }
    let chID : string = request.session.channelID;

    const config = {
        // TODO: make dynamic
        // translate from english to portuguese
        audioConfig: {
            audioEncoding: "linear16",
            sourceLanguageCode: "en-US",
            targetLanguageCode: "pt-BR",
        },
        // continue translating even if speaker pauses
        singleUtterance: false,       
    };

    // configure translation listeners only once
    if(request.session.firstRequest === true) {
        // broadcasts translation results to all clients subscribed to the room
        stream.on('data', d => {
            const {error, result, _} = d;
            if(error !== null) {
            }
            // TODO: accumulate
            socket.emit("translatedAudioContent", result.textTranslationResult.translation);
            // TODO: send only to children
            // socket.to(chID).emit("received audio content", data);
        });
        
        // register error listener
        stream.on('error', e => {
            // TODO: how do we handle errors?
        })

        // send first request, which only needs streaming config
        stream.write({
            streamingConfig: config,
            audioContent: null,
        });

        request.session.firstRequest = false;

        // TODO: probably have to synchronously save sesssion here, instead
        // of waiting until the end of request.
    }

    // subsequent requests need audioContent
    stream.write({
        streamingConfig: config,
        audioContent: audioContent,
    });
}

const consumeAudioContent: RequestHandler = (req, res) => {
    res.sendFile(__dirname + "/../channels.html");
}

const getAllChannels: RequestHandler = (req, res) => {
    res.sendFile(__dirname + "/channels.html");
}

// ==================== EXPORT HANDLERS ====================== //

export {
    createChannel,
    emitAudioContent,
    consumeAudioContent,
    getChannels,
    getAllChannels,
};

