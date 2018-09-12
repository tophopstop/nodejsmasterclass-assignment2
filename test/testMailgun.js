/*
 * Primary file for API
 *
 */

// Dependencies
var mailgun = require('../lib/mailgun');

mailgun.sendEmail(
    'jason@slamomatic.com',
    'this is my subject',
    'this is the message here',
    function(err) {
        if( !err ) {
            console.log('mail sent!');
        } else {
            console.log('send failed:',err);
        }
    }
);

