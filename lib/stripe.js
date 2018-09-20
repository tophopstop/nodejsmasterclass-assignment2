var https = require('https');
var querystring = require('querystring');
var config = require('../lib/config');
var helpers = require('../lib/helpers');
var StringDecoder = require('string_decoder').StringDecoder;

var stripe = {};

stripe.makeToken = function( name, creditCardNumber, exp_month, exp_year, cvc, callback ){

    // validate again here?

    // n/b: in real life you wouldn't want to actual
    // capture the customer's cc number and pass it
    // through; you'd use stripe's front end code to
    // get the oneTimeToken for you, so your code
    // never even gets to see the real credit card
    // number.

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

                var customerStringPayload = querystring.stringify({
                    'description' : 'Customer: '+name,
                    'source' : j.id 
                });

                // can recycle requestDetails, just
                // update the path and content-length

                requestDetails.path = '/v1/customers';
                requestDetails['headers']['Content-Length'] = Buffer.byteLength(customerStringPayload);

                var customerReq = https.request(requestDetails,function(customerRes){
        
                    // catch the data
                    var customerDecoder = new StringDecoder('utf-8');
                    var customerBuffer = '';
                    customerRes.on('data', function(customerData) {
                       customerBuffer += customerDecoder.write(customerData);
                    });
                    customerRes.on('end', function() {
                        customerBuffer += customerDecoder.end();
                        if( this.statusCode == 200 ) {
                            var customerJson = helpers.parseJsonToObject( customerBuffer );
                            callback(false,customerJson.id);

                        } else {

                            callback(this.statusCode,'Failed to create customer.');
                        }
                    });

                });

                customerReq.on('error',function(e){
                    console.log('gross fail customer...',e);
                });

                // Add the payload
                customerReq.write( customerStringPayload );

                // End the request
                customerReq.end();

                // end customer part

            } else {
                callback(this.statusCode,'Failed to create one time token.');
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

stripe.makeCharge = function( amount, stripeToken, description, callback ){

    var payload = {
        'currency' : 'usd', // should probably move to config
        'amount' : amount,
        'source' : stripeToken,
        'description' : description,
    };

    var stringPayload = querystring.stringify(payload);

    // Configure the request details
    var requestDetails = {
        'protocol' : 'https:',
        'hostname' : 'api.stripe.com',
        'method' : 'POST',
        'path' : '/v1/charges',
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

            console.log( this.statusCode, buffer);
            if( this.statusCode == 200 ) {
                var j = helpers.parseJsonToObject( buffer );
                callback(false,j.id);
            } else {
                callback(this.statusCode,'Failed to create charge.');
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
