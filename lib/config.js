/*
 * Create and export configuration variables
 *
 */

// keep all the confidential config items in a separate
// file that's not included in the git repo.
var secrets = require('../secrets');

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
    'hashingSecret' : secrets.hash,
    mailgun : secrets.mailgun,
    menu: menu,
    stripe : secrets.stripe
};

// Production environment
environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    hashingSecret : secrets.hash,
    mailgun : secrets.mailgun,
    menu: menu,
    stripe : secrets.stripe
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
