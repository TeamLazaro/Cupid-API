
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
let datetime = require( `${ rootDir }/lib/datetime.js` );
let dbms = require( `${ rootDir }/lib/dbms.js` );
let Person = require( `${ rootDir }/lib/entities/Person.js` );


/*
 * -/-/-/-/-/
 * Add a person
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/people-pretty", middleware.allowPreFlightRequest );


	router.get( "/v2/people-pretty", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		let databaseClient = await dbms.getClient();
		let database = databaseClient.db( "cupid" );
		let collection = database.collection( "people" );
		let records = await collection.find( { } ).toArray();
		for ( record of records ) {
			record.createdOn = datetime.getDateInNumeric( record.createdOn );
			record.createdOn = datetime.getDateInNumeric( record.createdOn );
		}
		res.json( records );
		res.end();

	} );

	return router;

}
