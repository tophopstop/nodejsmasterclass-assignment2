
var https = require('https');
var querystring = require('querystring');
var config = require('.config');

var payload = {
    from : config.mailgun.from,
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
    'path' : '/v3/'+ config.mailgun.from + '/messages',
    'auth' : 'api:' + config.mailgun.apiKey,
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
});

// Bind to the error event so it doesn't get thrown
req.on('error',function(e){
    console.log('gross fail...',e);
});

// Add the payload
req.write(stringPayload);

// End the request
req.end();
