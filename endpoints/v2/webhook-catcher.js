
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
let dbms = require( `${ rootDir }/lib/dbms.js` );


/*
 * -/-/-/-/-/
 * Add a person
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/webhooks/catch", middleware.allowPreFlightRequest );


	router.post( "/v2/webhooks/catch", async function ( req, res ) {

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
		let databaseClient = await dbms.getClient();
		let database = databaseClient.db( "cupid" );
		let collection = database.collection( "webhooks-dumpyard" );

		let recordMeta = { __schema: 1 };
		let record = Object.assign( { }, req.body, recordMeta );
		try {
			await collection.insertOne( record );
		}
		catch ( e ) {}

	} );

	return router;

}
