
/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

module.exports = {
    creds: {
        redirectUrl: 'http://localhost:3000/token',
        clientID: '{ENTER_YOUR_APPLICATION_ID_HERE}',
        clientSecret: '{ENTER_YOUR_APPLICATION_SECRET_HERE}',
        identityMetadata: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
        allowHttpForRedirectUrl: true, // For development only
        responseType: 'code',
        validateIssuer: false, // For development only
        responseMode: 'query',
        scope: ['User.Read', 'Profile'] // permissions to request on behalf of the user
    },
    webhook : {
        changeType: 'updated',
        notificationUrl: 'https://{ENTER YOUR NGROK PUBLIC URL HERE}/listen', 
        resource: 'security/alerts',
        clientState: 'cLIENTsTATEfORvALIDATION' // **
    }
};

// ** Setting this property will allow you to confirm that notifications 
// you receive originate from the Microsoft Graph service. For this reason, 
// the value of the property should remain secret and known only to your 
// application and the Microsoft Graph service.
