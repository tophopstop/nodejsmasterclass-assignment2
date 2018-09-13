// simple interface for sending email using mailgun service.

// dependencies
var config = require('./config');
var https = require('https');
var querystring = require('querystring');

var mailgun = {};

mailgun.sendEmail = function(email, subject, message, callback){

    // expected options:
    //  email (required)
    //  subject (required)
    //  message (required)

    // validation

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
            from : 'postmaster@sandboxc8a4962c075f4e0e98e9af401c063edb.mailgun.org',
            to : 'jason@slamomatic.com',
            subject : 'hello there',
            text : 'testing some mailgun awesomeness!'
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
    
console.log(requestDetails);

        // Instantiate the request object
        var req = https.request(requestDetails,function(res){
            // Grab the status of the sent request
            var status =  res.statusCode;

            //res.on('data', (d) => {
    //console.log(d);
  //});
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
