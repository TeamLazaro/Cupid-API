
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
let Person = require( `${ rootDir }/lib/entities/Person.js` );


/*
 * -/-/-/-/-/
 * Add a person
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/people", middleware.allowPreFlightRequest );


	router.get( "/v2/people", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		// Pull the data from the request
		let client = req.query.client.toLowerCase();
		let phoneNumber = req.query.phoneNumber;


		/*
		 * Create a Person
		 */
		let person;
		try {
			person = new Person( client, phoneNumber );
		}
		catch ( e ) {
			// It's highly likely that the essential details weren't provided
			res.json( { message: e.message } );
			res.end();
			return;
		}

		/*
		 * Get the person
		 */
		try {
			await person.getForUser();
		}
		catch ( e ) {
			await log.toUs( {
				context: `Querying a person from the database`,
				message: "A request to query a person came in through the API.",
			} );
		}

		if ( person._id )
			res.json( { code: 200, data: person } );
		else {
			res.status( 404 );
			res.json( { code: 404, message: "No person found with the provided information." } );
		}
		res.end();

	} );

	return router;

}
