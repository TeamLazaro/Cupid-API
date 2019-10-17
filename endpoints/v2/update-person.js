
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


	router.put( "/v2/people", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		// Pull the data from the request
		let client = req.body.client;
		let phoneNumber = req.body.phoneNumber;
		// Optional attributes
		let deviceId = req.body.deviceId;
		let interests = req.body.interests;
		let name = req.body.name;
		let emailAddress = req.body.emailAddress;


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

		// Respond back pre-emptively ( and optimistically )
		res.json( { message: "The person will be updated." } );
		res.end();

		/*
		 * Add the person
		 */
		try {
			await person.get();
		}
		catch ( e ) {
			return;
		}

		person
			.hasDeviceIds( deviceId )
			.isCalled( name )
			.hasEmailAddress( emailAddress )

		if ( interests instanceof Array )
			person.isInterestedIn( ...interests );

		try {
			await person.update();
		}
		catch ( e ) {
			await log.toUs( {
				context: `Updating a person`,
				message: "A request to update a person came in through the API.",
			} );
		}

	} );

	return router;

}
