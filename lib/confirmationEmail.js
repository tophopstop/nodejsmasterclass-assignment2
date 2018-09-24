
/*
 * confirmationEmail.js
 * support code for generating message
 * body for order confirmation email
*/

var confirmationEmail = {};

// make - generates the email message body
// args: orderObject
// returns string

confirmationEmail.make = function( o ) {

    var s = '';
    s+='Thanks again for your order!\n\n';
    s+='Order Number: ' + o.orderId + '\n\n';
    s+='Order Details:\n';
    s+='------------------------------------\n';

    o.items.forEach(function(v,i){
        s+= v.name + ' ('+ confirmationEmail.currencyFormat(v.cost)+') x ' + v.quantity + ' = ' + confirmationEmail.currencyFormat(v.lineTotal) + '\n';
    });

    s+='------------------------------------\n';
    s+='Order Total: '+ confirmationEmail.currencyFormat(o.total)+'\n\n';
    s+='Please call again soon!\n';

    return s;

};

// currencyFormat
// a quick and dirty function to convert from
// all cents to dollars and cents. this should
// probably be refactored into helpers for
// more reused
// args: money amount in cents
// returns: string formatted as USD

confirmationEmail.currencyFormat = function ( m ) {
    var d = m/100;
    return '$' + d.toFixed(2);
};

module.exports = confirmationEmail;

