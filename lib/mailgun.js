/*
 * mailgun.js - simple interface for sending
 * email via mailgun
*/

// dependencies
var config = require('./config');
var https = require('https');
var querystring = require('querystring');

var mailgun = {};

// sendEmail - just like it sounds, send
// an email using mail email service
// required args: email address, subject, message body (text) callback

mailgun.sendEmail = function(email, subject, message, callback){

    // validation args:

    email =
        typeof(email) == 'string'
        && email.trim().length > 0
        ? email.trim() : false;

    subject =
        typeof(subject) == 'string'
        && subject.trim().length > 0
        ? subject.trim() : false;

    message =
        typeof(message) == 'string'
        && message.trim().length > 0
        ? message.trim() : false;

    if( email && subject && message) {
        // make the payload for the request
        var payload = {
            from : config.mailgun.from,
            to : email,
            subject : subject,
            text : message
        };

        var stringPayload = querystring.stringify(payload);

        // Configure the request details
        var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.mailgun.net',
            'method' : 'POST',
            'path' : '/v3/'+config.mailgun.domain+'/messages',
            'auth' : 'api:'+config.mailgun.apiKey,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };
    
        // Instantiate the request object
        var req = https.request(requestDetails,function(res){
            // Grab the status of the sent request
            var status =  res.statusCode;

            if(status == 200 || status == 201){
              callback(false);
            } else {
              callback(status);
            }
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error',function(e){
            console.log('gross fail...');
            callback(e);
        });

        // Add the payload
        req.write(stringPayload);

        // End the request
        req.end();

    } else {
        callback('Given parameters were missing or invalid');
    }

};

module.exports = mailgun;
