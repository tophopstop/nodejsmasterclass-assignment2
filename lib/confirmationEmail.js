
var confirmationEmail = {};

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

confirmationEmail.currencyFormat = function ( m ) {
    var d = m/100;
    return '$' + d.toFixed(2);
};

module.exports = confirmationEmail;

