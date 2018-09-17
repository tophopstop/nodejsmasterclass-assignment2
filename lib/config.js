/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environments = {};

var menu = {
    1 : {
        name : "Pepperoni Pizza",
        description: "Dough, red sauce, mozzarella cheese, pepperoni",
        cost : 1500
    },
    2 : {
        name : "Pulled Pork Pizzazz",
        description: "Dough, home made barbque sauce, mozzarella cheese, smoked pulled pork",
        cost : 1700
    },
    3 : {
        name : "El Pollo Loco",
        description: "Dough, frank's red hot sauce, mozzarella cheese, grilled chicken breast",
        cost : 1800
    },
    4 : {
        name : "Garden of Eden",
        description: "Dough, garlic sauce, onions, mushrooms, tomatoes, peppers",
        cost: 1450
    }
};

// Staging (default) environment
environments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret',
  'maxChecks' : 5,
  'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  },
    mailgun : {
        from: 'postmaster@sandboxc8a4962c075f4e0e98e9af401c063edb.mailgun.org',
        apiKey: '9bd1ab640f70b7b9a9f58b0a680dbed2-7bbbcb78-c8acf306',
        domain: 'sandboxc8a4962c075f4e0e98e9af401c063edb.mailgun.org'
    },
    menu: menu
};

// Production environment
environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'maxChecks' : 10,
  'twilio' : {
    'accountSid' : '',
    'authToken' : '',
    'fromPhone' : ''
  }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
