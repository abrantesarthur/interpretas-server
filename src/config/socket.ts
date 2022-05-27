import { SpeechTranslationServiceClient } from '@google-cloud/media-translation';
import { Socket } from "socket.io";
import express = require('express');
import { isString } from "../utils";
import * as ch from '../handlers/channels';

// ================ CONFIGURE MEDIA TRANSLATION API ================== //
  
// Creates a client
const client = new SpeechTranslationServiceClient();

// Create a recognize stream
const stream = client.streamingTranslateSpeech();


// ================ CONFIGURE SOCKET CONNECTION ================== //

export const configureSocketConnection = async (socket: Socket) => {
    console.log("socket received new connection");
    let request = socket.request as express.Request;
  
    // make sure a channel_id was passed and is a string
    let channel_id = socket.handshake.query.channel_id;
  
    if(!isString(channel_id) || channel_id.length == 0) {
      socket.disconnect();
      return;
    }
  
    // if this is an authenticated request, make sure user who connected owns the channel
    if(request.isAuthenticated()) {
      // get user id
      // let userID = request.session.passport.user;
  
      // TODO get user's channels and make sure he's the owner
  
      // set flag to true, so we handle translation API semantics correctly
      request.session.firstRequest = true;

      // register event handlers for when radio host broadcasts audio content
      socket.on("audioContent", (audioContent) => ch.emitAudioContent(audioContent, socket));
    } else {
      console.log("unauthenticated");
    }
  
    // subscribe socket to the channel room
    socket.join(channel_id);
  
    // save channel ID in session for easy access in subsequent events
    request.session.channelID = channel_id;
  
    // notify client that they can start sending requests
    socket.emit("connected");
}