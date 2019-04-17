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
const os = require("os");


const APIVERSION = "v1.0";

var client = null; // Graph Client

const RESTURL = "https://graph.microsoft.com/" + APIVERSION + "/";
const TITLE = 'Microsoft Graph Security API Demo';


// Homepage
router.get('/', (req, res) => {
    // Used to pass data to the UI
    if (!req.session.VIEWDATA) {
        req.session.VIEWDATA = {};
    }

    // check if user has the correct delegated scopes to run the app
    if (req.session.missingScopes) {
        res.render('admin', { title: TITLE, viewData: req.session.VIEWDATA, session: req.session});
    } else {
        res.render('index', { title: TITLE, viewData: req.session.VIEWDATA, session: req.session });
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
    req.session.VIEWDATA = {};
    if (req.query.error) {
        let message = '<strong>Error:</strong> ' + req.query.error + '</br> <strong>Reason:</strong> ' + req.query.error_description;
        res.flash('danger', message);
        res.redirect('/');
    } else if (req.query.admin_consent === "True") {
        let message = '<strong>Success</strong> Tenant: ' + req.query.tenant + ' has given this application admin consent.';
        req.logOut();
        req.session.VIEWDATA = {};
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

        req.session.user = req.user;
        scopesReturned = scopesReturned.split(" ");
        req.session.scopes = scopesReturned;
        req.session.VIEWDATA.apiVersion = APIVERSION; // used for graph explorer link 
        req.session.VIEWDATA.restUrl = RESTURL;
        console.log(scopesReturned);

        // verify that the correct scopes are in the token
        checkScopes(req, res, scopesReturned, async () => {
            client = MicrosoftGraph.Client.init({
                defaultVersion: APIVERSION,  // Security API is currently in beta
                debugLogging: true,
                authProvider: (done) => {
                    done(null, req.user.accessToken); //first parameter takes an error if you can't get an access token
                }
            });
            module.exports.client = client;
            await getSecureScores(req)
            // await getSecureScoreProfiles(req)
            res.redirect('/providers');
        });
    });

// check the scopes to make sure the all the required scopes are contained in the accesss token
function checkScopes(req, res, scopes, next) {
    if (scopes.includes('User.Read.All') && scopes.includes('SecurityEvents.ReadWrite.All')) {
        req.session.missingScopes = false;
        next();
    } else {
        req.session.VIEWDATA.appId = config.creds.clientID; // used in the admin consent link 
        req.session.VIEWDATA.redirectUri = config.creds.redirectUrl; // used in the admin consent link 
        req.session.missingScopes = true;
        res.redirect('/');
    }
}


// get all the providers for the current tenant
router.get('/providers', ensureAuthenticated, (req, res) => {
    client.api('security/alerts')
        .top(1)
        .get()
        .then((response) => {
            var values = response['value'];
            var vendorInfo = {};
            var providers = [];
            values.forEach((v) => {
                vendorInfo[v.vendorInformation.provider] = v.vendorInformation;
                providers.push(v.vendorInformation.provider)
            });

            req.session.providers = providers;
            req.session.vendorInfo = vendorInfo;
            console.log(providers);

            res.redirect('/');
        }).catch((err) => {
            console.log(err);
            renderError(err, res);
    });
});
        

router.get('/alerts',(req, res) => {
    req.session.VIEWDATA = {}
    res.redirect('/');
    });


// Make a Graph call using the provided form data.
router.post('/GetAlerts', ensureAuthenticated, (req, res) => {
    // console.log(req);
    let formData = req.body;
    req.session.VIEWDATA = {}
    req.session.VIEWDATA.formData = formData;
    req.session.VIEWDATA.apiVersion = APIVERSION;
    req.session.VIEWDATA.restUrl = RESTURL; 

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
            req.session.VIEWDATA.alerts = response;
            req.session.VIEWDATA.restQuery = restQuery;
            req.session.VIEWDATA.sdkQuery = "client.api('security/alerts').filter(" + filterQuery + ").top(" + formData.top + ").get((err, response) => {...});"; 
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
        if (formData.category && formData.category !== 'All') {
            query += "category eq '" + formData.category + "'";
            op = " and ";
        }
        if (formData.status && formData.status !== 'All') {
            query += op + "status eq '" + formData.status + "'";
            op = " and ";
        }
        if (formData.provider && formData.provider !== 'All') {
            query += op + "vendorInformation/provider eq '" + formData.provider + "'";
            op = " and ";
        }
        if (formData.severity && formData.severity !== 'All') {
            query += op + "severity eq '" + formData.severity + "'";
            op = " and ";
        }
        if (formData.upn && formData.upn !== '') {
            query += op + "userStates/any(a:a/userPrincipalName eq '" + formData.upn + "')";
            op = " and ";
        }
        if (formData.fqdn && formData.fqdn !== '') {
            query += op + "hostStates/any(a:a/fqdn eq '" + formData.fqdn + "')";
        }
    }
    return query;
}

// Gets the alert from microsoft graph by alert id
router.get('/GetAlert/:alertID', ensureAuthenticated, async (req, res) => {
    var alertID = req.params.alertID;

    //clear old alert data
    req.session.VIEWDATA = {}

    req.session.VIEWDATA.apiVersion = APIVERSION;
    req.session.VIEWDATA.restUrl = RESTURL; 


    // set the query details in the view data
    req.session.VIEWDATA.sdkQuery = "client.api('security/alerts/ "+ alertID + "').get((err, response) => {...});";
    req.session.VIEWDATA.restQuery = "security/alerts/" + alertID;

    var response = await getAlert(req, res, alertID); // make a call to the api

    // if the alert contains user info, make additional calls to the graph to enrich the user details tab
    if (response.userStates && response.userStates[0] && response.userStates[0].userPrincipalName) {
        let upn = response.userStates[0].userPrincipalName;
        await Promise.all([getUserPhoto(req, upn), getUserInfo(req, upn), getUserManager(req, upn)
            , getUserRegisteredDevices(req, upn), getUserOwnedDevices(req, upn) ]);
    }

    res.redirect('/');
});

// call the graph to get the alert by id
function getAlert(req, res, id) {
    return client.api('security/alerts/' + id)
        .get()
        .then((response) => {
            req.session.VIEWDATA.alert = response;
            if ('@odata.context' in response){ // remove ODATA entity
                delete response['@odata.context'];
            }
            return response;
        })
        .catch((err) => {
            console.log("Alert error : ", err);
            if (err.statusCode === 404) {
                req.session.VIEWDATA.alert = err;
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
function getUserInfo(req, upn) {
    return client.api('users/' + upn) 
        .version('v1.0')
        .get()
        .then((response) => {
            req.session.VIEWDATA.alertUserState = response;
        })
        .catch((err) => {
            console.log("User info error : ",err);
        });
}

// call the graph to get the users photo
function getUserPhoto(req, upn) {
    return client.api("users/" + upn + "/photo/$value")
        .header("Content-type", "image/Png")
        .version('beta')    
        .get()
        .then((response) => {
            console.log(response);
            req.session.VIEWDATA.alertUserPhoto = response.toString('base64');
        })
        .catch((err) => {
            console.log("Photo error : ",err);
        });
}


// call the graph to get the users manager
function getUserManager(req, upn) {
    return client.api("users/" + upn + "/manager")
        .version('v1.0')
        .get()
        .then((response) => {
            req.session.VIEWDATA.alertUserManager = response;
        })
        .catch((err) => {
            console.log("Manager error : ", err);
        });
}


// call the graph to get the users registered devices
function getUserRegisteredDevices(req, upn) {
    return client.api("users/" + upn + "/registeredDevices")
        .version('v1.0')
        .get()
        .then((response) => {
            req.session.VIEWDATA.UserRegisteredDevices = response.value;
        })
        .catch((err) => {
            console.log("RegisteredDevices error : ", err);
        });
}

// call the graph to get the users owned devices
function getUserOwnedDevices(req, upn) {
    return client.api("users/" + upn + "/ownedDevices")
        .version('v1.0')
        .get()
        .then((response) => {
            req.session.VIEWDATA.UserOwnedDevices = response.value;
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

function getSubscriptions() {
    return client.api('subscriptions')
    .get()
    .then((response) => {
        return response;
    })
    .catch((err) => {
        console.log("Get subscriptions error : ", err);
    });
}

// call the graph to get the tenants secure score
function getSecureScores(req) {
    return client.api('/security/secureScores')
        .top(1)
        .get()
        .then((response) => {
            // console.log("Secure Scores: ", response);
            req.session.secureScores = response;
        })
        .catch((err) => {
            console.log("secureScores error : ",err);
        });
}

// call the graph to get the tenants secure score
function getSecureScoreProfiles(req) {
    return client.api('/security/secureScoreControlProfiles') 
        .get()
        .then((response) => {
            // console.log("Secure Score profiles: ", response);
            req.session.VIEWDATA.secureScoreProfiles = response;
        })
        .catch((err) => {
            console.log("secureScoreProfiles error : ",err);
        });
}

// make a PATCH request to the API with the update form data.
router.post('/UpdateAlert', ensureAuthenticated, async (req, res) => {
    let updateForm = req.body;

    req.session.VIEWDATA = {}
    req.session.VIEWDATA.apiVersion = APIVERSION;
    req.session.VIEWDATA.restUrl = RESTURL; 

    var alertID = updateForm.alertId;

    if (alertID === '') {
        console.log("No Alert ID entered");
        let message = "<strong>Error:</strong> Please enter a valid alert id to update.";
        res.flash('danger', message);
        res.redirect('/');
    } else {
        // make a call to save the alert before the PATCH request
        req.session.VIEWDATA.oldAlert = await getAlert(req, res, alertID);

        if (req.session.VIEWDATA.oldAlert) { // if the alert exists
            updateForm.assignedTo = await getUserEmail(); // get the current user email
            
            //required vendor information from the alert 
            let vendorInfo = req.session.VIEWDATA.oldAlert.vendorInformation;
            updateForm.vendorInformation = vendorInfo;

            //parse comments and create array
            var comments = updateForm.comments;
            if (comments != ''){
                console.log("splitting");
                comments = comments.split(os.EOL);
                console.log("comments", comments);
                updateForm.comments = comments;
            }
            req.session.VIEWDATA.sdkQuery = "client.api('security/alerts/ "+ alertID + "').patch(UPDATEDDATA, (err, response) => {...});";
            
            req.session.VIEWDATA.postRestQuery = {
                query: "security/alerts/" + alertID,
                body: updateForm
            };
            console.log("PATCH Body : ", updateForm);

            try {
                let response = await client.api('security/alerts/' + alertID).patch(updateForm);
                console.log("Response: ", response);
                var alert = await getAlert(req, res, alertID);
                    req.session.VIEWDATA.alert = alert;

                    if (alert.userStates && alert.userStates[0] && alert.userStates[0].userPrincipalName) {
                        let upn = alert.userStates[0].userPrincipalName;
                        await Promise.all([getUserPhoto(req, upn), getUserInfo(req, upn), getUserManager(req, upn)
                            , getUserRegisteredDevices(req, upn), getUserOwnedDevices(req, upn)]);
                    }
                    res.redirect('/');
            } catch (error) {
                console.log(error);
                renderError(error, res);            
            }
        } else {
            res.redirect('/');
        }
    }
});

// Make a Graph call using the provided form data to update or create a webhook subscription.
router.post('/subscribe', ensureAuthenticated, async (req, res) => {
    let formData = req.body;

    req.session.VIEWDATA = {}

    req.session.VIEWDATA.webhookFormData = formData;
    req.session.VIEWDATA.apiVersion = APIVERSION;
    req.session.VIEWDATA.restUrl = RESTURL; 

    let filterQuery = buildFilterQuery(formData);

    var restQuery = "/security/alerts?";
    if (filterQuery !== '') {
        restQuery += "$filter=" + filterQuery;
        console.log("restQuery : ", restQuery);

        var body = config.webhook;
        body.resource = restQuery;
        let expire = new Date();
        expire.setHours(expire.getHours() + 1);
        body['expirationDateTime'] = expire;

        let subscriptions = await getSubscriptions();
        subscriptions = subscriptions.value;
        let oldsub = null;
        if (subscriptions.length > 0) {
            for (var i = 0; i < subscriptions.length; i++) {
                if (subscriptions[i].resource === restQuery) {
                    console.log("Same resource");
                    oldsub = subscriptions[i];
                    break;
                }
            }
        }
        if (oldsub != null) { // update(PATCH) the same webhook subscription
            body = {};
            body['expirationDateTime'] = expire;
            console.log("body : ", body);
            console.log("Old sub : ", oldsub);
            client.api('subscriptions/'+ oldsub.id).patch(body, (err, response) => {
                req.session.VIEWDATA.sdkQuery = "client.api('subscriptions').patch(body, (err, response) => {...});"; 
                req.session.VIEWDATA.postRestQuery = {
                    query: "subscriptions/"+ oldsub.id,
                    body: body
                };
                if (err) {
                    console.log(err);
                    renderError(err, res);
                } else {
                    console.log('subscription PATCH response : ', response);
                    let message = '<strong>Success</strong> Webhook subscription Updated. Id: ' + response.id;
                    res.flash('success', message);
                    req.session.VIEWDATA.webhook = {'POST': response};
                    res.redirect('/');
                }
            });

        } else {    // Create a new webhook subscription
            console.log("body : ", body);
            client.api('subscriptions').post(body, (err, response) => {
                req.session.VIEWDATA.sdkQuery = "client.api('subscriptions').post(body, (err, response) => {...});"; 
                req.session.VIEWDATA.postRestQuery = {
                    query: "subscriptions",
                    body: body
                };
                if (err) {
                    console.log(err);
                    renderError(err, res);
                } else {
                    console.log('subscription post response : ', response);
                    let message = '<strong>Success</strong> Webhook subscription created. Id: ' + response.id;
                    res.flash('success', message);
                    req.session.VIEWDATA.webhook = {'POST': response};
                    res.redirect('/');
                }
            });
        }
    } else { // filterQuery is == ''
        let message = "<strong>Error:</strong> Subscription requires at least one filter parameter.";
        res.flash('danger', message);
        res.redirect('/');
    }
});

// get webhook subscriptions
router.get('/subscriptions', ensureAuthenticated, async (req, res) => {

    req.session.VIEWDATA = {}

    req.session.VIEWDATA.apiVersion = APIVERSION;
    req.session.VIEWDATA.restUrl = RESTURL; 

    let response = await getSubscriptions();
    
    console.log('subscription GET response : ', response);
    req.session.VIEWDATA.webhook = {'GET': response};
    req.session.VIEWDATA.restQuery = 'subscriptions';
    req.session.VIEWDATA.sdkQuery = "client.api('subscriptions').get((err, response) => {...});"; 
    res.redirect('/');
});


// get all the providers for the current tenant
router.get('/secureScore', ensureAuthenticated, async (req, res) => {
    req.session.VIEWDATA = {};
    var restQuery = "security/secureScoreControlProfiles";
    req.session.VIEWDATA.restQuery = restQuery;
    req.session.VIEWDATA.apiVersion = APIVERSION;
    req.session.VIEWDATA.restUrl = RESTURL; 

    await getSecureScoreProfiles(req)
    req.session.VIEWDATA.sdkQuery = "client.api('/security/secureScoreControlProfiles').get((err, response) => {...});"; 
    res.redirect('/');
});

router.get('/Actions', ensureAuthenticated, (req, res) => {
    req.session.VIEWDATA = {}
    req.session.VIEWDATA.apiVersion = "beta";
    req.session.VIEWDATA.restUrl = "https://graph.microsoft.com/beta/"; 
    req.session.VIEWDATA.restQuery = 'security/securityActions';
    req.session.VIEWDATA.sdkQuery = "client.api('security/securityActions').version('beta').get().then((response) => {...}).catch((err) => {...}));";


    client.api('/security/securityActions')
        .version("beta")
        .get()
        .then((response) => {
            console.log("Security actions: ", response);
            req.session.VIEWDATA.securityActions = {'GET': response.value};
            res.redirect('/');
        })
        .catch((err) => {
            console.log("securityActions error : ",err);
            renderError(error, res); 
        });

});

// make a PATCH request to the API with the update form data.
router.post('/Actions', ensureAuthenticated, (req, res) => {
    let actionForm = req.body;

    req.session.VIEWDATA = {}
    req.session.VIEWDATA.apiVersion = "beta";
    req.session.VIEWDATA.restUrl = "https://graph.microsoft.com/beta/"; 

    console.log(actionForm);

    var ActionBody = {};

    ActionBody['name'] = actionForm.SelectAction;
    ActionBody['vendorInformation'] = req.session.vendorInfo[actionForm.provider];
    ActionBody['parameters'] = [ {"name": actionForm.propertyName, "value": actionForm.propertyValue} ];
    ActionBody['actionReason'] = actionForm.reason;

    req.session.VIEWDATA.sdkQuery = "client.api('security/securityActions').version('beta').post(ActionBody).then((response) => {...}).catch((err) => {...}));";
            
    req.session.VIEWDATA.postRestQuery = {
        query: "security/securityActions",
        body: ActionBody,
        method: "POST"
    };
    console.log("POST Body : ", ActionBody);


    client
        .api('security/securityActions')
        .version('beta')
        .post(ActionBody)
        .then((response) => {
            console.log("Security actions: ", response);
            req.session.VIEWDATA.securityActions = {'POST': [response]};
            res.redirect('/');
        })
        .catch((err) => {
            console.log("securityActions error : ",err);
            renderError(error, res); 
        });
    // res.redirect('/');
});



// clear the session when logging out
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        req.logOut();
        res.clearCookie('graphNodeCookie');
        res.status(200);
        res.redirect('/');
    });
});


// helper function to ensure that the user is authenticated by Azure AD
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }

  res.redirect('/login');
}

// renders the error page
  function renderError(e, res) {
      e.innerError = (e.response) ? e.response.text : '';
      console.log(e);
      if (e.message.includes("Must respond with 200 OK to this request.")){
        console.log("**** Run 'ngrok' to allow the webhook service to call your localhost app.****\n**** Update the config.js file to the corresponding URL.****");
        let message = "<strong>Error:</strong> Please run 'ngrok' to allow the webhook notification service to access your app, then update the config.js file to the correct ngrok url.";
        res.flash('danger', message);
      }

      res.render('error', {
        error: e
    });
  }

module.exports.router = router;
