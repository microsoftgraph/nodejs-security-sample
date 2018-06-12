/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

'use strict';
var express = require('express');
var router = express.Router();
const passport = require('passport');
const MicrosoftGraph = require("@microsoft/microsoft-graph-client");
const config = require('../config.js');
const flash = require('flash')();

const APIVERSION = "beta";

var client = null; // Graph Client

const RESTURL = "https://graph.microsoft.com/" + APIVERSION + "/";
const TITLE = 'Microsoft Graph Security API Demo';

// Used to pass data to the UI
var VIEWDATA = { };


// Homepage
router.get('/', (req, res) => {
    // check if user has the correct delegated scopes to run the app
    if (req.session.missingScopes) {
        res.render('admin', { title: TITLE, viewData: VIEWDATA });
    } else {
        res.render('index', { title: TITLE, viewData: VIEWDATA });
    }
  });

// Authentication request.
router.get('/login',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    });

// Authentication callback.
// After we have an access token, get user data and check the scopes returned.
router.get('/token', (req, res, next) => {
    // Checks if the redirect was from the authentication or the admin consent flow.
    if (req.query.error) {
        let message = '<strong>Error:</strong> ' + req.query.error + '</br> <strong>Reason:</strong> ' + req.query.error_description;
        res.flash('danger', message);
        res.redirect('/');
    } else if (req.query.admin_consent === "True") {
        let message = '<strong>Success</strong> Tenant: ' + req.query.tenant + ' has given this application admin consent.';
        req.logOut();
        VIEWDATA = {};
        req.session.missingScopes = false;
        res.flash('success', message);
        res.redirect('/');
    } else {
        next();
    }
}, passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
    (req, res) => {
        // save the scopes returned by Azure AD
        var scopesReturned = req.user.params['scope'];

        VIEWDATA.user = req.user;
        scopesReturned = scopesReturned.split(" ");
        VIEWDATA.scopes = scopesReturned;
        VIEWDATA.apiVersion = APIVERSION; // used for graph explorer link 
        VIEWDATA.restUrl = RESTURL;

        // verify that the correct scopes are in the token
        checkScopes(req, res, scopesReturned, () => {
            client = MicrosoftGraph.Client.init({
                defaultVersion: APIVERSION,  // Security API is currently in beta
                debugLogging: true,
                authProvider: (done) => {
                    done(null, req.user.accessToken); //first parameter takes an error if you can't get an access token
                }
            });
            res.redirect('/providers');
        });
    });

// check the scopes to make sure the all the required scopes are contained in the accesss token
function checkScopes(req, res, scopes, next) {
    if (scopes.includes('User.Read.All') && (scopes.includes('SecurityEvents.Read.All') || scopes.includes('SecurityEvents.ReadWrite.All'))) {
        req.session.missingScopes = false;
        next();
    } else {
        VIEWDATA.appId = config.creds.clientID; // used in the admin consent link 
        VIEWDATA.redirectUri = config.creds.redirectUrl; // used in the admin consent link 
        req.session.missingScopes = true;
        res.redirect('/');
    }
}

// get all the providers for the current tenant
router.get('/providers', ensureAuthenticated, (req, res) => {
    client.api('security/alerts').top(1).get((err, response) => {
        if (err) {
            console.log(err);
            renderError(err, res);
        } else {
            var providers = response.value.map((v) => {
                return v.vendorInformation.provider;
            });
            VIEWDATA.providers = providers;
            console.log(providers);
            res.redirect('/');
        }
    });
});

// Make a Graph call using the provided form data.
router.post('/GetAlerts', ensureAuthenticated, (req, res) => {
    // console.log(req);
    let formData = req.body;
    VIEWDATA.formData = formData;
    VIEWDATA.alert = null;
    delete VIEWDATA.oldAlert; 
    let filterQuery = buildFilterQuery(formData);
    console.log("filterQuery : ", filterQuery);

    var restQuery = "security/alerts?";
    if (filterQuery !== '') {
        restQuery += "$filter=" + filterQuery + "&";
    }
    restQuery += "$top=" + formData.top;
    console.log("restQuery : ", restQuery);

    client.api('security/alerts').filter(filterQuery).top(formData.top).get((err, response) => {
        if (err) {
            console.log(err);
            renderError(err, res);
        } else {
            VIEWDATA.alerts = response;
            VIEWDATA.restQuery = restQuery;
            VIEWDATA.sdkQuery = "client.api('security/alerts').filter(" + filterQuery + ").top(" + formData.top + ").get((err, response) => {...}"; 
            res.redirect('/');
        }
    });
});

// Builds the query string for the API call
function buildFilterQuery(formData) {
    let query = "";
    //console.log("formData : ", formData);
    if (formData) { 
        let op = "";
        if (formData.category !== 'All') {
            query += "category eq '" + formData.category + "'";
            op = " and ";
        }
        if (formData.status !== 'All') {
            query += op + "status eq '" + formData.status + "'";
            op = " and ";
        }
        if (formData.provider !== 'All') {
            query += op + "vendorInformation/provider eq '" + formData.provider + "'";
            op = " and ";
        }
        if (formData.severity !== 'All') {
            query += op + "severity eq '" + formData.severity + "'";
            op = " and ";
        }
        if (formData.upn !== '') {
            query += op + "userStates/any(a:a/userPrincipalName eq '" + formData.upn + "')";
            op = " and ";
        }
        if (formData.fqdn !== '') {
            query += op + "hostStates/any(a:a/fqdn eq '" + formData.fqdn + "')";
        }
    }
    return query;
}

// Gets the alert from microsoft graph by alert id
router.get('/GetAlert/:alertID', ensureAuthenticated, async (req, res) => {
    var alertID = req.params.alertID;

    //clear old alert data
    delete VIEWDATA.alertUserState;
    delete VIEWDATA.alertUserPhoto;
    delete VIEWDATA.alertUserManager;
    delete VIEWDATA.alertUserRegisteredDevices;
    delete VIEWDATA.alertUserOwnedDevices;
    delete VIEWDATA.oldAlert;

    // set the query details in the view data
    VIEWDATA.sdkQuery = "client.api('security/alerts/ "+ alertID + "').get((err, response) => {...}";
    VIEWDATA.restQuery = "security/alerts/" + alertID;

    var response = await getAlert(res, alertID); // make a call to the api

    // if the alert contains user info, make additional calls to the graph to enrich the user details tab
    if (response.userStates && response.userStates[0] && response.userStates[0].userPrincipalName) {
        let upn = response.userStates[0].userPrincipalName;
        await Promise.all([getUserPhoto(upn), getUserInfo(upn), getUserManager(upn)
            , getUserRegisteredDevices(upn), getUserOwnedDevices(upn) ]);
    }

    res.redirect('/');
});

// call the graph to get the alert by id
function getAlert(res, id) {
    return client.api('security/alerts/' + id)
        .get()
        .then((response) => {
            VIEWDATA.alert = response;
            return response;
        })
        .catch((err) => {
            console.log("Alert error : ", err);
            if (err.statusCode === 404) {
                VIEWDATA.alert = err;
                let message = "<strong>Error:</strong> No alert matching this ID '" + id + "' was found";
                res.flash('danger', message);
                res.redirect('/');
            } else {
                renderError(err, res);
            }
            return null;
        });
}


// call the graph to get the user info
function getUserInfo(upn) {
    return client.api('users/' + upn) 
    .version('v1.0')
    .get()
        .then((response) => {
            VIEWDATA.alertUserState = response;
        })
        .catch((err) => {
            console.log("User info error : ", err);
        });
}

// call the graph to get the users photo
function getUserPhoto(upn) {
    return client.api("users/" + upn + "/photo/$value")
        .get()
        .then((response) => {
            VIEWDATA.alertUserPhoto = response;

        })
        .catch((err) => {
            console.log("Photo error : ", err);
        });
}

// call the graph to get the users manager
function getUserManager(upn) {
    return client.api("users/" + upn + "/manager")
        .version('v1.0')
        .get()
        .then((response) => {
            VIEWDATA.alertUserManager = response;
        })
        .catch((err) => {
            console.log("Manager error : ", err);
        });
}


// call the graph to get the users registered devices
function getUserRegisteredDevices(upn) {
    return client.api("users/" + upn + "/registeredDevices")
        .version('v1.0')
        .get()
        .then((response) => {
            VIEWDATA.UserRegisteredDevices = response.value;
        })
        .catch((err) => {
            console.log("RegisteredDevices error : ", err);
        });
}

// call the graph to get the users owned devices
function getUserOwnedDevices(upn) {
    return client.api("users/" + upn + "/ownedDevices")
        .version('v1.0')
        .get()
        .then((response) => {
            VIEWDATA.UserOwnedDevices = response.value;
        })
        .catch((err) => {
            console.log("OwnedDevices error : ", err);
        });
}

// call the graph to get the users email or userPrincipalName
function getUserEmail() {
    return client.api('me')
        .version('v1.0')
        .get()
        .then((response) => {
            return response.mail ? response.mail : response.userPrincipalName;
        })
        .catch((err) => {
            console.log("Email error : ", err);
        });
}


// make a PATCH request to the API with the update form data.
router.post('/UpdateAlert', ensureAuthenticated, async (req, res) => {
    let updateForm = req.body;
    VIEWDATA.alert = null;   // clear old alert
    var alertID = updateForm.alertId;
    delete updateForm.alertId;
    delete VIEWDATA.alertUserState;
    delete VIEWDATA.alertUserPhoto;
    delete VIEWDATA.alertUserManager;
    delete VIEWDATA.alertUserRegisteredDevices;
    delete VIEWDATA.alertUserOwnedDevices;
    if (alertID === '') {
        console.log("No Alert ID entered");
        let message = "<strong>Error:</strong> Please enter a valid alert id to update.";
        res.flash('danger', message);
        res.redirect('/');
    } else {
        // make a call to save the alert before the PATCH request
        VIEWDATA.oldAlert = await getAlert(res, alertID);

        delete VIEWDATA.sdkQuery;
        delete VIEWDATA.restQuery; // using postRestQuery instead because of the body

        if (VIEWDATA.oldAlert) { // if the alert exists
            updateForm.assignedTo = await getUserEmail(); // get the current user email
            VIEWDATA.sdkQuery = "client.api('security/alerts/ " + alertID + "').patch(UPDATEDDATA, (err, response) => {...});";
            VIEWDATA.postRestQuery = {
                query: "security/alerts/" + alertID,
                body: updateForm
            };
            client.api('security/alerts/' + alertID).patch(updateForm, async (err, response) => {
                if (err) {
                    console.log(err);
                    renderError(err, res);
                } else {
                    console.log("Body : ", updateForm);

                    // make another call to get the updated alert
                    var alert = await getAlert(res, alertID);
                    VIEWDATA.alert = alert;

                    if (alert.userStates && alert.userStates[0] && alert.userStates[0].userPrincipalName) {
                        let upn = alert.userStates[0].userPrincipalName;
                        await Promise.all([getUserPhoto(upn), getUserInfo(upn), getUserManager(upn)
                            , getUserRegisteredDevices(upn), getUserOwnedDevices(upn)]);
                    }
                    delete VIEWDATA.alerts; // clear the previous alerts in the matching alerts table
                    res.redirect('/');
                }
            });
        } else {
            res.redirect('/');
        }
    }
});



// clear the session when logging out
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        req.logOut();
        res.clearCookie('graphNodeCookie');
        res.status(200);
        VIEWDATA = {};
        res.redirect('/');
    });
});



// helper function to ensure that the user is authenticated by Azure AD
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }

  res.redirect('/login');
}

function hasAccessTokenExpired(e) {
    let expired;
    if (!e.innerError) {
      expired = false;
    } else {
      expired = e.forbidden &&
        e.message === 'InvalidAuthenticationToken' &&
        e.response.error.message === 'Access token has expired.';
    }
    return expired;
  }

// renders the error page
  function renderError(e, res) {
      e.innerError = (e.response) ? e.response.text : '';
      console.log(e);

      res.render('error', {
        error: e
    });
  }

module.exports = router;
