
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let Person = require( `${ rootDir }/lib/entities/Person.js` );
// Third-party packages
let axios = require( "axios" );


/*
 * -/-/-/-/-/
 * Add a person
 *	The source of the person can be from the Website or the CRM.
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/people/verification/OTP", middleware.allowPreFlightRequest );


	router.post( "/v2/people/verification/OTP", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		// Pull the data from the request
		let client = req.body.client;
		let phoneNumber = req.body.phoneNumber;
		let interest = req.body.interest;

		let person = new Person( client, phoneNumber )
						.isInterestedIn( interest )

		try {
			person = await person.get();
		} catch ( e ) {
			res.json( { code: 404, message: "No person found with the given phone number." } );
			res.end();
			return;
		}

		// Now, send the SMS
		// TODO: Pull the api key and the template name
		try {
			response = await axios.get( `https://2factor.in/API/V1/${ apiKey }/SMS/${ person.phoneNumber }/AUTOGEN/${ template }` );
		}
		catch ( e ) {
			//
		}

		res.json( response );
		res.end();

	} );

	return router;

}
