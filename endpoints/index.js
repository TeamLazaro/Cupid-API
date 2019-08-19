
/*
 *
 * Packages
 *
 */
// Our custom imports
let { router, middleware } = require( "../lib/routing.js" );





router = require( "./v1/status.js" )( router, middleware );
router = require( "./get-people.js" )( router, middleware );
router = require( "./add-person.js" )( router, middleware );
router = require( "./verify-person.js" )( router, middleware );
router = require( "./research-customer-by-crm-id.js" )( router, middleware );
router = require( "./v1/report-customer-allocation.js" )( router, middleware );
router = require( "./v1/report-customer-concluded-meetings.js" )( router, middleware );





module.exports = router;
