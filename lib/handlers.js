/*
 * Request Handlers
 *
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');
var stripe = require('./stripe');
var mailgun = require('./mailgun');
var confirmationEmail = require('./confirmationEmail');

// Define all the handlers
var handlers = {};

// Ping
handlers.ping = function(data,callback){
  setTimeout(function(){
    callback(200);
  },5000);

};

// Not-Found
handlers.notFound = function(data,callback){
  callback(404);
};

// Users
handlers.users = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the users methods
handlers._users  = {};

// Users - post
// Required data: name, email, street address, password, creditCardNumber, exp_mon, exp_year, cvc
// Optional data: none

handlers._users.post = function( data,callback ) {
    // Check that all required fields are filled out
    var name =
        typeof(data.payload.name) == 'string'
        && data.payload.name.trim().length > 0
        ? data.payload.name.trim() : false;

    var email =
        typeof(data.payload.email) == 'string'
        && data.payload.email.trim().length > 0
        ? data.payload.email.trim() : false;

    var address =
        typeof(data.payload.address) == 'string'
        && data.payload.address.trim().length > 0
        ? data.payload.address.trim() : false;

    var password =
        typeof(data.payload.password) == 'string'
        && data.payload.password.trim().length > 0
        ? data.payload.password.trim() : false;

    var creditCardNumber =
        typeof(data.payload.creditCardNumber) == 'string'
        && data.payload.creditCardNumber.trim().length > 0
        && data.payload.creditCardNumber.match(/^\d+$/)
        ? data.payload.creditCardNumber.trim() : false;

    var exp_mon =
        typeof(data.payload.exp_mon) == 'number'
        && data.payload.exp_mon > 0
        && data.payload.exp_mon < 13
        ? data.payload.exp_mon : false;

    var exp_year =
        typeof(data.payload.exp_year) == 'number'
        && data.payload.exp_year >=2018
        && data.payload.exp_year < 2030
        ? data.payload.exp_year : false;
    
    var cvc =
        typeof(data.payload.cvc) == 'number'
        && data.payload.cvc >= 0
        && data.payload.cvc <= 999
        ? data.payload.cvc : false;

    if( name && email && address && password && creditCardNumber && exp_mon && exp_year && cvc ) {

        // Make sure the user doesnt already exist
        _data.read('users',email,function(err,data){

            if(err){

                // get a stripe token for the customer

                stripe.makeCustomer( name, creditCardNumber, exp_mon, exp_year, cvc, function(err,data){
                    if( !err ) {

                        // Hash the password
                        var hashedPassword = helpers.hash(password);

                        // Create the user object
                        if(hashedPassword){
                            var userObject = {
                                'name' : name,
                                'email' : email,
                                'address' : address,
                                'hashedPassword' : hashedPassword,
                                stripeCustomerToken: data
                            };

                            // Store the user
                            _data.create('users',email,userObject,function(err){
                                if(!err){
                                    callback(200);
                                } else {
                                    callback(500,{'Error' : 'Could not create the new user'});
                                }
                            });
                        } else {
                            callback(500,{'Error' : 'Could not hash the user\'s password.'});
                        }

                    } else {
                        // failed to create a stripe token
                        callback(err, data);
                    }
                
                });

            } else {
                // User alread exists
                callback(400,{'Error' : 'A user with that email already exists'});
            }
        });

    } else {
        callback(400,{'Error' : 'Missing required fields'});
    }

};

// get - get details for a user
// Required data: email
// Optional data: none

handlers._users.get = function(data,callback){

    // Check that email is valid
    var email =
        typeof(data.queryStringObject.email) == 'string'
        && data.queryStringObject.email.trim().length > 0
        ? data.queryStringObject.email.trim() : false;

    if(email){

        // Get token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,email,function(tokenIsValid){
            if(tokenIsValid){
                // Lookup the user
                _data.read('users',email,function(err,data){
                    if(!err && data){
                        // Remove the hashed password from the user user object before returning it to the requester
                        delete data.hashedPassword;
                        callback(200,data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403,{"Error" : "Missing required token in header, or token is invalid."})
            }
        });
    } else {
        callback(400,{'Error' : 'Missing required field'})
    }
};

// put - update an existing user
// Required data: email
// Optional data: name, address, password (at least one must be specified)

handlers._users.put = function(data,callback){

    // Check for required field
    
    var email =
        typeof(data.payload.email) == 'string'
        && data.payload.email.trim().length > 0
        ? data.payload.email.trim() : false;

    // Check for optional fields

    var name =
        typeof(data.payload.name) == 'string'
        && data.payload.name.trim().length > 0
        ? data.payload.name.trim() : false;

    var address =
        typeof(data.payload.address) == 'string'
        && data.payload.address.trim().length > 0
        ? data.payload.address.trim() : false;
    
    var password =
        typeof(data.payload.password) == 'string'
        && data.payload.password.trim().length > 0
        ? data.payload.password.trim() : false;

    if(email){
        // Error if nothing is sent to update
        if(name || address || password){

            // Get token from headers
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            //// Verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token,email,function(tokenIsValid){

                if(tokenIsValid){

                    // Lookup the user
                    _data.read('users',email,function(err,userData){
                        if(!err && userData){
                            // Update the fields if necessary
                            if(name){
                                userData.name = name;
                            }
                            if(address){
                                userData.address = address;
                            }
                            if(password){
                                userData.hashedPassword = helpers.hash(password);
                            }

                            // Store the new updates
                            _data.update('users',email,userData,function(err){
                                if(!err){
                                    callback(200);
                                } else {
                                   callback(500,{'Error' : 'Could not update the user.'});
                                }
                            });
                        } else {
                            callback(400,{'Error' : 'Specified user does not exist.'});
                        }
                    });
                } else {
                    callback(403,{"Error" : "Missing required token in header, or token is invalid."});
                }
            });
        } else {
            callback(400,{'Error' : 'Missing fields to update.'});
        }
    } else {
        callback(400,{'Error' : 'Missing required field.'});
    }

};

// delete - remove an existing user
// Required data: email

handlers._users.delete = function(data,callback){
    // Check that phone number is valid
    var email =
        typeof(data.queryStringObject.email) == 'string'
        && data.queryStringObject.email.trim().length > 0
        ? data.queryStringObject.email.trim() : false;

    if(email){

        // Get token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,email,function(tokenIsValid){
            if(tokenIsValid){
                // Lookup the user
                _data.read('users',email,function(err,userData){
                    if(!err && userData){
                        // Delete the user's data
                        _data.delete('users',email,function(err){
                            if(!err){
                                callback(200);
                            } else {
                                callback(500,{'Error' : 'Could not delete the specified user'});
                            }
                        });
                    } else {
                        callback(400,{'Error' : 'Could not find the specified user.'});
                    }
                });
            } else {
                callback(403,{"Error" : "Missing required token in header, or token is invalid."});
            }
        });
    } else {
        callback(400,{'Error' : 'Missing required field'})
    }
};

// Tokens
handlers.tokens = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens  = {};

// post - creat a new token
// Required data: email, password
// Optional data: none

handlers._tokens.post = function(data,callback){

    var email =
        typeof(data.payload.email) == 'string'
        && data.payload.email.trim().length > 0
        ? data.payload.email.trim() : false;
    
    var password =
        typeof(data.payload.password) == 'string'
        && data.payload.password.trim().length > 0
        ? data.payload.password.trim() : false;

    if(email && password){
        // Lookup the user who matches that email 
        _data.read('users',email,function(err,userData){
            if(!err && userData){
                // Hash the sent password, and compare it to the password stored in the user object
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'email' : email,
                        'id' : tokenId,
                        'expires' : expires
                    };

                    // Store the token
                    _data.create('tokens',tokenId,tokenObject,function(err){

                        if(!err){
                            callback(200,tokenObject);
                        } else {
                            callback(500,{'Error' : 'Could not create the new token'});
                        }
                      });
                } else {
                    callback(400,{'Error' : 'Password did not match the specified user\'s stored password'});
                }
            } else {
                callback(400,{'Error' : 'Could not find the specified user.'});
            }
        });
    } else {
        callback(400,{'Error' : 'Missing required field(s).'})
    }
};

// get - get details for a token
// Required data: id
// Optional data: none
//
// TODO why doesn't this have an auth check?
// this is not used currently.
//handlers._tokens.get = function(data,callback){
  //// Check that id is valid
  //var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  //if(id){
    //// Lookup the token
    //_data.read('tokens',id,function(err,tokenData){
      //if(!err && tokenData){
        //callback(200,tokenData);
      //} else {
        //callback(404);
      //}
    //});
  //} else {
    //callback(400,{'Error' : 'Missing required field, or field invalid'})
  //}
//};

// put - update an existing token.
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data,callback){

    var id =
        typeof(data.payload.id) == 'string'
        && data.payload.id.trim().length == 20
        ? data.payload.id.trim() : false;

    var extend =
        typeof(data.payload.extend) == 'boolean'
        && data.payload.extend == true
        ? true : false;

    if(id && extend){
        // Lookup the existing token
        _data.read('tokens',id,function(err,tokenData){
            if(!err && tokenData){
                // Check to make sure the token isn't already expired
                if(tokenData.expires > Date.now()){
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    // Store the new updates
                    _data.update('tokens',id,tokenData,function(err){
                        if(!err){
                            callback(200);
                        } else {
                            callback(500,{'Error' : 'Could not update the token\'s expiration.'});
                        }
                    });
                } else {
                    callback(400,{"Error" : "The token has already expired, and cannot be extended."});
                }
            } else {
                callback(400,{'Error' : 'Specified user does not exist.'});
            }
        });
    } else {
        callback(400,{"Error": "Missing required field(s) or field(s) are invalid."});
    }
};


// delete - remove an existing token
// Required data: id
// Optional data: none

handlers._tokens.delete = function(data,callback){
    // Check that id is valid
    var id =
        typeof(data.queryStringObject.id) == 'string'
        && data.queryStringObject.id.trim().length == 20
        ? data.queryStringObject.id.trim() : false;
    if(id){
        // Lookup the token
        _data.read('tokens',id,function(err,tokenData){
            if(!err && tokenData){
                // Delete the token
                _data.delete('tokens',id,function(err){
                    if(!err){
                        callback(200);
                    } else {
                        callback(500,{'Error' : 'Could not delete the specified token'});
                    }
                });
            } else {
                callback(400,{'Error' : 'Could not find the specified token.'});
            }
        });
    } else {
        callback(400,{'Error' : 'Missing required field'})
    }
};

// Verify if a given token id is currently valid for a given user

handlers._tokens.verifyToken = function(id,email,callback){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
        if(!err && tokenData){
            // Check that the token is for the given user and has not expired
            if(tokenData.email == email && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// Menu
handlers.menu = function(data,callback){
    var acceptableMethods = ['get'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._menu[data.method](data,callback);
    } else {
        callback(405);
    }
};

// Container for all the menu methods
handlers._menu  = {};

// Required data: none 
// Optional data: none

handlers._menu.get = function(data,callback){
    
    var email =
        typeof(data.queryStringObject.email) == 'string'
        && data.queryStringObject.email.trim().length > 0
        ? data.queryStringObject.email.trim() : false;

    var token =
        typeof(data.headers.token) == 'string'
        ? data.headers.token : false;

    // Verify that the given token is valid and belongs to the user who created the check
    handlers._tokens.verifyToken(token,email,function(tokenIsValid){
        if(tokenIsValid){
            callback(200,config.menu);
        } else {
            callback(403);
        }
    });
};


// Cart
handlers.cart = function(data,callback){
  var acceptableMethods = ['get','post'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._cart[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the menu methods
handlers._cart  = {};

// post - add an item to user's cart
// Required data: email, item, quantity
// Optional data: none

handlers._cart.post = function( data, callback ) {

    var email =
        typeof(data.payload.email) == 'string'
        && data.payload.email.trim().length > 0
        ? data.payload.email.trim() : false;
    
    var item =
        typeof(data.payload.item) == 'number'
        && data.payload.item % 1 === 0
        && data.payload.item >= 1
        ? data.payload.item : false;

    // TODO add a check to make sure its a valid item
    
    var quantity =
        typeof(data.payload.quantity) == 'number'
        && data.payload.quantity % 1 === 0
        && data.payload.quantity >= 1
        ? data.payload.quantity : false;

    if( email && item && quantity ) {

        // Get token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,email,function(tokenIsValid){

            if(tokenIsValid){
                // Lookup the user
                _data.read('users',email,function(err,data){
                    if(!err && data){

                        var c = data.cart;
                        var cart =
                            typeof(data.cart) == 'object'
                            && data.cart instanceof Array
                            ? data.cart : [];

                        cart.push({
                            'item': item,
                            'quantity': quantity
                        });

                        data.cart = cart;

                        // Store the new updates
                        _data.update('users',email,data,function(err){
                            if(!err){
                                callback(200);
                            } else {
                               callback(500,{'Error' : 'Could not add item to cart.'});
                            }
                        });
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403,{"Error" : "Missing required token in header, or token is invalid."})
            }
        });

    } else {
        callback(400,{'Error' : 'Missing required field.'});
    }

};

// get - fetch items for a user's cart
// Required data: email
// Optional data: none

handlers._cart.get = function(data,callback){

    // Check that email is valid
    var email =
        typeof(data.queryStringObject.email) == 'string'
        && data.queryStringObject.email.trim().length > 0
        ? data.queryStringObject.email.trim() : false;

    if(email){

        // Get token from headers
        var token =
            typeof(data.headers.token) == 'string'
            ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,email,function(tokenIsValid){
            
            if(tokenIsValid){
                // Lookup the user
                _data.read('users',email,function(err,data){
                    if(!err && data){

                        // start an accumulator for order toal
                        var orderTotal = 0;

                        // loop through cart and plug in ancillary
                        // details from the menu (price, line total,
                        // name, etc.)
                        data.cart.forEach( function( entry){
                            var t = config.menu[ entry.item ];
                            entry.cost = t.cost;
                            entry.name = t.name;
                            entry.lineTotal = parseInt(t.cost) * parseInt(entry.quantity);
                            orderTotal += entry.lineTotal;
                        } );

                        callback(200,{ items: data.cart, total: orderTotal });
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403,{"Error" : "Missing required token in header, or token is invalid."})
            }
        });
    } else {
        callback(400,{'Error' : 'Missing required field'})
    }
};

handlers.order = function(data,callback){
  var acceptableMethods = ['post'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._order[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the order methods
handlers._order  = {};

// port - turn the items in the user's cart into an order
// Required data: email
// Optional data: none

handlers._order.post = function( data, callback ) {

    var email =
        typeof(data.payload.email) == 'string'
        && data.payload.email.trim().length > 0
        ? data.payload.email.trim() : false;

    if( email ) {

        var token =
            typeof(data.headers.token) == 'string'
            ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,email,function(tokenIsValid){
            if(tokenIsValid){
                // Lookup the user
                _data.read('users',email,function(err,data){
                    if(!err && data){

                        // start an accumulator for order toal
                        var orderTotal = 0;

                        // loop through cart and plug in ancillary
                        // details from the menu (price, line total,
                        // name, etc.)
                        data.cart.forEach( function(entry){
                            var t = config.menu[ entry.item ];
                            entry.cost = t.cost;
                            entry.name = t.name;
                            entry.lineTotal = parseInt(t.cost) * parseInt(entry.quantity);
                            orderTotal += entry.lineTotal;
                        } );
                        
                        var userOrders =
                            typeof( data.orders ) == 'object'
                            && data.orders instanceof Array
                                ? data.orders : [];

                        // ring up the order at stripe.
                        stripe.makeCharge( orderTotal, data.stripeCustomerToken, 'Pizza Order', function(err,stripeChargeId){
                            if( !err ) {

                                // save the order to a file
                                var orderId = helpers.createRandomString(20);

                                var orderObject = {
                                    items: data.cart,
                                    total: orderTotal,
                                    timestamp: Date.now(),
                                    chargeId: stripeChargeId,
                                    orderId: orderId
                                };

                                _data.create('orders',orderId,orderObject,function(err){
                                    if(!err){
                                        // Add order id to the user's object 
                                        userOrders.push(orderId);
                                        data.orders = userOrders;

                                        // clear out the cart
                                        data.cart = [];

                                        // Save the new user data
                                        _data.update('users',email,data,function(err){
                                            if(!err){

                                                // send order confirmation email

                                                var emailBody = confirmationEmail.make(orderObject);

                                                mailgun.sendEmail(
                                                    email,
                                                    'Thank you for your order!',
                                                    emailBody,
                                                    function(err) {
                                                        if( !err ) {
                                                            console.log('mail sent!');
                                                            callback(200,orderObject);
                                                        } else {
                                                            console.log('send failed:',err);
                                                            callback(500,{'Error' : 'Order confirmation email send failed.'});
                                                        }
                                                    }
                                                );

                                            } else {
                                                callback(500,{'Error' : 'Could not update the user with the new order.'});
                                            }
                                        });
                                    } else {
                                        callback(500,{'Error' : 'Could not create the new order file'});
                                    }
                                });

                                // end save to file

                            } else {
                                callback( err, data );
                            }
                        });
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403,{"Error" : "Missing required token in header, or token is invalid."})
            }
        });
    } else {
        callback(400,{'Error' : 'Missing required field'})
    }
};

// Export the handlers
module.exports = handlers;
