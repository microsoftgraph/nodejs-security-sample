/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

'use strict';
const debug = require('debug');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const uuid = require('uuid');
const config = require('./config.js');
const session = require('express-session');

const app = express();

const server = require('http').Server(app)
const ioServer = require('socket.io')(server);
module.exports.io = ioServer;
app.io = ioServer;

var routes = require('./routes/index').router;
var webhookRoutes = require('./routes/listen').router;

// authentication setup
const callback = (iss, sub, profile, accessToken, refreshToken, params, done) => {
    done(null, {
        profile,
        accessToken,
        refreshToken,
        params
    });
  };
  
passport.use(new OIDCStrategy(config.creds, callback));
  
const users = {};
passport.serializeUser((user, done) => {
    const id = uuid.v4();
    users[id] = user;
    done(null, id);
});
passport.deserializeUser((id, done) => { 
    const user = users[id];
    done(null, user);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: '12345QWERTY-SECRET',
    name: 'graphNodeCookie',
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false} // For development only
  }));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('flash')());

app.use('/', routes);
app.use('/listen', webhookRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
} else {
    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

app.set('port', process.env.PORT || 3000);



// var server = app.listen(app.get('port'), function () {
//     debug('Express server listening on port ' + server.address().port);
// });

server.listen(app.get('port'));
debug('Express server listening on port ' + server.address().port);




  


