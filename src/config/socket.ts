import { Socket } from "socket.io";
import express = require('express');
import { isString } from "../utils";
import * as ch from '../handlers/channels';

export const configureSocketConnection = async (socket: Socket) => {
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
    }
  
    // subscribe socket to the channel room
    socket.join(channel_id);
  
    // save channel ID in session for easy access in subsequent events
    request.session.channelID = channel_id;
  
    // register event handlers
    socket.on("audioContent", (audioContent) => ch.emitAudioContent(audioContent, socket));
  
    // notify client that they can start sending requests
    socket.emit("connected");
}