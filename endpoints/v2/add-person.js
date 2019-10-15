
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


	router.post( "/v2/people", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		// Pull the data from the request
		let client = req.body.client;
		let phoneNumber = req.body.phoneNumber;
		// Optional attributes
		let source = req.body.source;
		let deviceId = req.body.deviceId;
		let verificationMethod = req.body.verificationMethod;
		let interests = req.body.interests;


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
		res.json( { message: "The person will be added." } );
		res.end();

		/*
		 * Add the person
		 */
		person
			.cameFrom( source.medium, source.point )
			.hasDeviceIds( deviceId )
			.isInterestedIn( interests )

		// Mark if the person is verified
		if ( verificationMethod )
			person.verifiedWith( verificationMethod );
		else
			person.unverify();

		try {
			await person.add();
		}
		catch ( e ) {
			await log.toUs( {
				context: `Adding a person to the database`,
				message: "A request to add a person came in through the API.",
			} );
		}

	} );

	return router;

}
