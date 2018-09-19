
//https://stripe.com/docs/api#charge_object
//curl https://api.stripe.com/v1/charges \
   //-u sk_test_K9qwwgMqzMHt9s1E6FTuoKE2: \
   //-d amount=2000 \
   //-d currency=usd \
   //-d source=tok_visa \
   //-d description="Charge for jenny.rosen@example.com"

var https = require('https');
var querystring = require('querystring');
var config = require('../lib/config');
var helpers = require('../lib/helpers');
var StringDecoder = require('string_decoder').StringDecoder;

var payload = {
    'currency' : 'usd',
    'amount' : '4750',
    'source' : 'tok_1D9tY8D8QKoOrsG5jQlVr7cM',
    'description' : 'Pizza Order: 12323',
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
        console.log('full response from stripe: '+buffer);
        var j = helpers.parseJsonToObject( buffer );
        console.log('charge id: '+j.id);
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

