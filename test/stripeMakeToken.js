
var https = require('https');
var querystring = require('querystring');
var config = require('../lib/config');
var helpers = require('../lib/helpers');
var StringDecoder = require('string_decoder').StringDecoder;

var payload = {
    'card[number]' : '4242424242424242',
    'card[exp_month]' : '12',
    'card[exp_year]' : '2019',
    'card[cvc]' : '123',
};

var stringPayload = querystring.stringify(payload);

// Configure the request details
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
    
// Instantiate the request object
var req = https.request(requestDetails,function(res){
    // Grab the status of the sent request
    var status =  res.statusCode;
    console.log('status:',status);

    // catch the data

    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    res.on('data', function(data) {
       buffer += decoder.write(data);
    });
    res.on('end', function() {
       buffer += decoder.end();
        //console.log('full response from stripe: '+buffer);
        var j = helpers.parseJsonToObject( buffer );
        console.log('token id: '+j.id);
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

