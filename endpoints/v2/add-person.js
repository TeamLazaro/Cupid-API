
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



		/* ------------------------------------------- \
		 *  Extract relevant data from the Request
		 \-------------------------------------------- */
		let client = req.body.client;
		let phoneNumber = req.body.phoneNumber;
		let source = req.body.source;

		// If the required data has not been provided
		if ( ! client || ! phoneNumber || ! ( source && source.medium ) ) {
			res.status( 400 );
			res.json( {
				code: 400,
				message: "Please provide a phone-number, associated client and the source medium."
			} );
			return;
		}

		// Make the client name lower-case
		client = client.toLowerCase();

		// Pull in any optional attributes
		let deviceId = req.body.deviceId;
		let interests = req.body.interests;
		let emailAddresses = req.body.emailAddresses;



		/* ----------------------- \
		 *  Validate the data
		 \------------------------ */
		if ( ! /^\+\d+/.test( phoneNumber ) )
			return invalidInputResponse( res, "Please provide a valid phone-number." );

		if ( typeof deviceId != "string" )
			deviceId = null;

		if ( ! ( interests instanceof Array ) )
			if ( typeof interests == "string" )
				interests = [ interests ];
			else
				interests = [ ];

		if ( ! ( emailAddresses instanceof Array ) )
			if ( typeof emailAddresses == "string" )
				emailAddresses = [ emailAddresses ];
			else
				emailAddresses = [ ];



		/* ---------------- \
		 *  Respond back
		 \----------------- */
		res.json( {
			code: 200,
			message: "The person will be added."
		} );
		res.end();



		/* -------------------------------------- \
		 *  Add the Person ( to the database )
		 \--------------------------------------- */
		// Build a Person object
		let person = new Person( client, phoneNumber )
						.cameFrom( source.medium, source.point )
						.hasDeviceIds( deviceId )
						.hasEmailAddress( ...emailAddresses )
						.isInterestedIn( ...interests )
						.unverify()

		// Add the Person to the database
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



/* ----------------- \
 * Helper functions
 \------------------ */
function invalidInputResponse ( response, message ) {
	response.status( 422 );
	response.json( {
		code: 422,
		message: message
	} );
	response.end();
}
