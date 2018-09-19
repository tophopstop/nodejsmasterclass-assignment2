var https = require('https');
var querystring = require('querystring');
var config = require('../lib/config');
var helpers = require('../lib/helpers');
var StringDecoder = require('string_decoder').StringDecoder;

var stripe = {};

stripe.makeToken = function( creditCardNumber, exp_month, exp_year, cvc, callback ){

    // validate again here?

    // prepare the data to be sent
    var payload = {
        'card[number]' : creditCardNumber,
        'card[exp_month]' : exp_month,
        'card[exp_year]' : exp_year,
        'card[cvc]' : cvc,
    };

    var stringPayload = querystring.stringify(payload);

    // configure the client for an HTTPS post
    var requestDetails = {
        'protocol' : 'https:',
        'hostname' : 'api.stripe.com',
        'method' : 'POST',
        'path' : '/v1/tokens',
        'auth' : config.stripe.secret,
        'headers' : {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload)
        }
    };

    // make the request
    var req = https.request(requestDetails,function(res){
        
        // catch the data
        var decoder = new StringDecoder('utf-8');
        var buffer = '';
        res.on('data', function(data) {
           buffer += decoder.write(data);
        });
        res.on('end', function() {
            buffer += decoder.end();

            if( this.statusCode == 200 ) {
                var j = helpers.parseJsonToObject( buffer );
                callback(false,j.id);
            } else {
                callback(res.statusCode,'Failed to create stripe token.');
            }
        });

    });

    // Bind to the error event so it doesn't get thrown
    req.on('error',function(e){
        console.log('gross fail...',e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();


};

module.exports = stripe;
