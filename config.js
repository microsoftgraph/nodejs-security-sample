
/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

module.exports = {
    creds: {
        redirectUrl: 'http://localhost:3000/token',
        clientID: 'ENTER YOUR APP ID HERE',
        clientSecret: 'ENTER YOUR APP SECRET HERE',
        identityMetadata: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
        allowHttpForRedirectUrl: true, // For development only
        responseType: 'code',
        validateIssuer: false, // For development only
        responseMode: 'query',
        scope: ['User.Read', 'Profile'] // permissions to request on behalf of the user
    }
};