import { SpeechTranslationServiceClient } from '@google-cloud/media-translation';
import { RequestHandler } from 'express';
import { Socket } from 'socket.io';
import { Error, ErrorType } from '../error';
import { RadioChannel } from '../models/radioChannel';
import { RadioHost } from '../models/radioHost';
import { validateArgument } from '../utils';
import express = require('express');
import * as gax from 'google-gax';

// ======================== DEFINE HANDLERS ========================== //

const createChannel: RequestHandler = async (req, res, next) => {

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
    const radioHost = await RadioHost
        .findById(radioHostId)
        .exec();

    if(!radioHost) {
        return next(new Error(
            404,
            ErrorType.NOT_FOUND,
            'could not find radio host with id "' + radioHostId + '"'
        ));
    }

    // make sure channel does not exist on database
    const radioChannel = await RadioChannel
        .findOne({radio_host_id: radioHost._id, name: req.body.name})
        .exec();
    

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

    const savedRadioChannel = await rc.save();

    return res.end(JSON.stringify({
        id: savedRadioChannel._id,
        radio_host_id: radioHost._id,
        name: savedRadioChannel.name,
    }))
}

const getChannelsByHostId : RequestHandler = async (req, res, next) => {    
    // get radio host id from url params
    let radioHostId  = req.params.radioHostId;


    // make sure radio host exists
    const radioHost = await RadioHost
        .findById(radioHostId)
        .exec();

    if(!radioHost) {
        return next(new Error(
            404,
            ErrorType.NOT_FOUND,
            'could not find radio host with id "' + radioHostId + '"'
        ));
    }


    // find channels
    const radioChannels = await RadioChannel
        .find({radio_host_id: radioHost._id})
        .exec();
    
         
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
}

const getAllChannels : RequestHandler = async (_, res, next) => {    
    const radioChannels = await RadioChannel
    .find()
    .exec();

    let channels : any[] = [];
    radioChannels.forEach((rc) => {
        channels.push({
            "id": rc._id,
            "radio_host_id": rc.radio_host_id,
            "name": rc.name,
        });
    })

    return res.end(JSON.stringify(channels));
}

const getChannelById : RequestHandler = async (req, res, next) => {    
    const radioChannel = await RadioChannel
    .findById(req.params.channelId)
    .exec();

    if(!radioChannel) {
        return next(new Error(
            400,
            ErrorType.INVALID_REQUEST,
            `Failed to find chanel with id '${req.params.channelId}'`
        ));
    }


    return res.end(JSON.stringify({
        "id": radioChannel._id,
        "radio_host_id": radioChannel.radio_host_id,
        "name": radioChannel.name,
    }));
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

    // instantiate a translation stream
    let client: SpeechTranslationServiceClient;
    let stream: any;

    // configure translation listeners only once
    if(request.session.firstRequest === true) {
        // initiate the translation stream
        client = new SpeechTranslationServiceClient();
        stream = client.streamingTranslateSpeech();

        // broadcasts translation results to all clients subscribed to the room
        stream.on('data', (d: any) => {
            const {error, result, _} = d;
            if(error !== null) {
            }
            // TODO: accumulate
            // broadcast translated audio to listeners
            socket.to(chID).emit("translatedAudioContent", result.textTranslationResult.translation);
        });
        
        // register error listener
        stream.on('error', (e: any) => {
            // TODO: how do we handle errors?
            console.log("an error has happened!");
            console.log(e);

            // restart the stream
            client = new SpeechTranslationServiceClient();
            stream = client.streamingTranslateSpeech();
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
        audioContent,
    });
}

// ==================== EXPORT HANDLERS ====================== //

export {
    createChannel,
    emitAudioContent,
    getChannelsByHostId,
    getAllChannels,
    getChannelById
};

