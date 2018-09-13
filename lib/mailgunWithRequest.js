// simple interface for sending email using mailgun service.

// dependencies
var config = require('./config');
var request = require('request');

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
        
        var url = 'https://api.mailgun.net/v3/sandboxc8a4962c075f4e0e98e9af401c063edb.mailgun.org/messages';

        // new request stuff goes here.
        var r = request.post(
            {
                url:url,
                form: {
                    from : 'postmaster@sandboxc8a4962c075f4e0e98e9af401c063edb.mailgun.org',
                    to : 'jason@slamomatic.com',
                    subject : 'hello there',
                    text : 'testing some mailgun awesomeness! wut? 125'
                
                },
                auth: {
                    'user': 'api',
                    'pass': '9bd1ab640f70b7b9a9f58b0a680dbed2-7bbbcb78-c8acf306'
                },
            },
            function(err,httpResponse,body){
                if( !err ) {
                    callback(false);
                } else {
                    callback(httpResponse);
                }
            }
        );

        //console.log(r);

        r.on('error',function(e){
            callback(e);
        });


    } else {
        callback('Given parameters were missing or invalid');
    }

};

module.exports = mailgun;
