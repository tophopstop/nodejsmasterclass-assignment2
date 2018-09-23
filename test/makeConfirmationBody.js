
var confirmationEmail = require('../lib/confirmationEmail');

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

var b = confirmationEmail.make(orderObject);
console.log(b);
