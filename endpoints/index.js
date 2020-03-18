
/*
 *
 * Packages
 *
 */
// Our custom imports
let { router, middleware } = require( "../lib/routing.js" );





router = require( "./v1/status.js" )( router, middleware );
router = require( "./v2/test-webhook.js" )( router, middleware );
router = require( "./get-people.js" )( router, middleware );
router = require( "./v1/add-person.js" )( router, middleware );
router = require( "./v1/verify-person.js" )( router, middleware );
router = require( "./v2/send-otp-to-person.js" )( router, middleware );
router = require( "./v2/verify-otp-of-person.js" )( router, middleware );
router = require( "./v2/get-person.js" )( router, middleware );
router = require( "./v2/add-person.js" )( router, middleware );
router = require( "./v2/verify-person.js" )( router, middleware );
router = require( "./v2/update-person.js" )( router, middleware );
router = require( "./v2/hooks/post-call.js" )( router, middleware );
router = require( "./v2/hooks/post-id-assignment.js" )( router, middleware );
router = require( "./v2/hooks/person-on-website.js" )( router, middleware );
router = require( "./v2/webhook-catcher.js" )( router, middleware );
// router = require( "./v1/report-customer-allocation.js" )( router, middleware );
// router = require( "./v1/report-customer-concluded-meetings.js" )( router, middleware );

/*
 * ----- Infrastructure
 */
// router = require( "./v2/providers/zoho-renew-api.js" )( router, middleware );


/*
 * ----- Client's API
 */
router = require( "./api/index.js" )( router, middleware );





module.exports = router;
