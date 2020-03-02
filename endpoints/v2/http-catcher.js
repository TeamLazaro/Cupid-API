
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let { waitFor } = require( `${ rootDir }/lib/utils.js` );


/*
 * -/-/-/-/-/
 * Add a person
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/http/catch", middleware.allowPreFlightRequest );


	router.post( "/v2/http/catch", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		// Respond back
		res.json( {
			code: 200,
			message: "Got the request."
		} );
		res.end();

		/* ------------------------------------------- \
		 * Dump all the relevant data from the Request
		 \-------------------------------------------- */
		console.log( "::User Agent::" );
		console.log( req.headers[ "user-agent" ] );
		console.log( "::Content Type::" );
		console.log( req.headers[ "content-type" ] );
		console.log( "::Query Parameters::" );
		console.log( req.query );
		console.log( "::Body::" );
		console.log( req.body );

	} );

	return router;

}
