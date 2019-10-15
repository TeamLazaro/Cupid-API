
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
let dbms = require( `${ rootDir }/lib/dbms.js` );
let Person = require( `${ rootDir }/lib/entities/Person.js` );


/*
 * -/-/-/-/-/
 * Verify a person
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/people/verify", middleware.allowPreFlightRequest );


	router.post( "/v2/people/verify", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		let client = req.body.client;
		let phoneNumbers = req.body.phoneNumbers;
		let verificationMethod = req.body.verificationMethod;

		if ( ! ( phoneNumbers instanceof Array ) ) {
			res.json( { message: "Please provide the client and the person's phone number(s)." } );
			res.end();
			return;
		}

		// Respond back pre-emptively ( and optimistically )
		res.json( { message: "The person will be verified." } );
		res.end();

		// Iterate through all the provided phone numbers
		for ( let phoneNumber of phoneNumbers ) {
			let person = new Person( client, phoneNumber );
			await person.get();
			// If a person with the phone number is not found,
				// skip to the next phone number
			if ( ! person._id )
				continue;
			// Mark the person "verified"
			person.verifiedWith( verificationMethod );
			await person.update();
			break;
		}

	} );

	return router;

}
