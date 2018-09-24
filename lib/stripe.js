/*
 * stripe.js - functions for processing credit
 * cards with stripe.com payment processor
 */

// dependencies

var https = require('https');
var querystring = require('querystring');
var config = require('../lib/config');
var helpers = require('../lib/helpers');
var StringDecoder = require('string_decoder').StringDecoder;

var stripe = {};

// makeCustomer - given a set of customer payment
// details, create a stripe customer entity object
// args: customer name, credit card number,
// expiration month, expiration year, cvc code, callback

// n/b: in real life you wouldn't want to actually
// capture the customer's cc number and pass it
// through; you'd use stripe's front end code to
// get the oneTimeToken for you, so your code
// never even gets to see the real credit card
// number.

stripe.makeCustomer = function( name, creditCardNumber, exp_month, exp_year, cvc, callback ){

    // part 1: get a one time token
    // for the customer's credit card

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
    
                // part II - take one time token and
                // use it to make a customer object
                // in a second request.

                var j = helpers.parseJsonToObject( buffer );

                var customerStringPayload = querystring.stringify({
                    'description' : 'Customer: '+name,
                    'source' : j.id // j.id is the one time token from the origina request
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
                            // customerJson.id is the stripe id
                            // for the customer object on that
                            // side.
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

// makeCharge - ring up an order for a customer
// args: amount (in cents), stripe customer token, order description, callback

stripe.makeCharge = function( amount, stripeCustomerToken, description, callback ){

    var payload = {
        'currency' : 'usd', // should probably move to config
        'amount' : amount,
        'customer' : stripeCustomerToken,
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

            if( this.statusCode == 200 ) {
                var j = helpers.parseJsonToObject( buffer );
                // j.id in this case is the stripe order id.
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
