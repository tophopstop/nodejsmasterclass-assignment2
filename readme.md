# Nodejs Master Class

## Assignment 2

### Work Areas

* Starting with the [FINAL repo version from section 3](https://github.com/pirple/The-NodeJS-Master-Class/tree/master/Section%203/FINAL):
    * Removed _checks_ related functionality
    * Removed _workers_ related functionality
* Added `secrets.js` config file for storing confidential config items. It is not included in the project's git repo by design.  A `secrets.js.template` is provided for setting up the project in new hosting environments.
* Added `mailgun.js` library that provides ability to send emails via [mailgun's REST api](https://documentation.mailgun.com/en/latest/api_reference.html).
* Added `stripe.js` library that provides functions for creating stripe customers and ringing up charges using the [stripe REST api](https://stripe.com/docs/api#intro).
* Replaced phone with email for unique identifier for users.
* Added a _cart_ attribute to users.
* When retrieving a user, include their cart details.
* When creating a new user, capture credit card details and use them to create a stripe customer token for later use.
* Added an API endpoint for users to retrieve a menu.
* Added `confirmationEmail.js` library that provides functions for generating order confirmation email bodies.
* Added an API endpoint to place an order.  This takes the user's cart, generates an order, charges for the order via stripe, and sends an order confirmation email via mailgun.
* Added a user verification check when deleting a token.

### REST Endpoint Summary

#### Users

##### POST

Create a new user. Each user must have a unique email address.
Required fields: (in JSON payload) `name`, `email`, `street address`, `password`, `creditCardNumber`, `exp_mon`, `exp_year`, `cvc`
Requires Token: No

##### GET

Retrieve data for an existing user as JSON.
Required fields: (in CGI parameter) `email`
Requires Token: Yes

##### PUT -

Update an existing user.
Required fields: `email`
Optional fields: `name`, `address`, `password` (at least one must be specified)
Requires Token: Yes

##### DELETE - email

Delete an existing user.
Required fields: (in CGI parameter) `email`
Requires Token: Yes

#### Tokens

* POST
// Required data: email, password
* PUT 
// Required data: id, extend
* DELETE - email

#### Menu

* GET

#### Cart

* POST

// Required data: email, item, quantity
* GET - email 

#### Order

* POST - email
