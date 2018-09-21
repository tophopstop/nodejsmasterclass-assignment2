
var orderObject = {
    items: [
        {
            cost: 1800,
            name: 'El Pollo Loco',
            lineTotal: 3600,
            quantity: 2,
        },
        {
            cost: 1450,
            name: 'Garden of Eden',
            lineTotal: 4350,
            quantity: 3
        },
    
    ],
    total: 7950,
    timestamp: Date.now(),
    chargeId: 'ch_2002303092032023',
    orderId: 'ijh86kfolt093nchbk'
};



function makeConfirmationBody( o ) {

    console.log('in make...');

    var s = '';

    s+='Thanks again for your order!\n\n';

    s+='Order Number: ' + o.orderId + '\n\n';

    s+='Order Details:\n';
    s+='------------------------------------\n';

    o.items.forEach(function(v,i){
        s+= v.name + ' ('+ currencyFormat(v.cost)+') x ' + v.quantity + ' = ' + currencyFormat(v.lineTotal) + '\n';
    });

    s+='------------------------------------\n';
    s+='Order Total: '+ currencyFormat(o.total)+'\n\n';

    s+='Please call again soon!\n';

    return s;

}

function currencyFormat( m ) {
    var d = m/100;
    return '$' + d.toFixed(2);
}

var b = makeConfirmationBody(orderObject);
console.log(b);
