/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

'use strict';
var express = require('express');
var router = express.Router();
const config = require('../config.js');
const client = require('./index.js').client;
const TITLE = 'Microsoft Graph Security API Demo';
const ioServer = require('../app').io;

router.get('/', (req, res, next) => {
    // Render the notification page.
    res.render('webhook', { title: TITLE, viewData: {} });
  });

router.post('/', (req, res, next) => {
// webhook service sends notifications as POST requests to the notificationUrl in the config file.
    if (req.query && req.query.validationToken) { // creating a new subscription.
        // Send a status of 'Ok' with the validation token back to the webhook 
        // service to create a new subscription.
        res.send(req.query.validationToken);
    } else {
        // notification pushed to the app.
        var clientStatesValid = false;
        console.log("Post from listen :", req.body);
        ioServer.to("test_room").emit('notification_received', req.body); // emit message to socket on notification page.
        res.sendStatus(202); // Accepted 
    }

});

// Socket event
ioServer.on('connection', socket => {
    socket.on('create_room', subscriptionId => {
      socket.join(subscriptionId);
      console.log("created socket room", subscriptionId);
    });
});

module.exports.router = router;