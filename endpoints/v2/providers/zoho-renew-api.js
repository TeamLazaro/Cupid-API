
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/../../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let crm = require( `${ rootDir }/lib/crm.js` );


/*
 * -/-/-/-/-/
 * Add a person
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/provider/zoho/renew", middleware.allowPreFlightRequest );


	router.post( "/v2/provider/zoho/renew", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		// Respond back
		res.json( {
			code: 200,
			message: "Will do the necessary.",
			timestamp: ( new Date ).toISOString()
		} );
		res.end();

		/* ------------------------------------------- \
		 * Renew Zoho's API key
		 \-------------------------------------------- */
		try {
			await crm.renewAPIKey();
		}
		catch ( e ) {
			await log.toUs( {
				message: e.message,
				context: "Renewing the Zoho API key",
				data: e
			} );
		}

	} );

	return router;

}
