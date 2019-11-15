
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
let Person = require( `${ rootDir }/lib/entities/Person.js` );
let PersonAddedWebhook = require( `${ rootDir }/lib/webhooks/added-person.js` );


/*
 * -/-/-/-/-/
 * Add a person
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/hooks/post-id-assignment", middleware.allowPreFlightRequest );


	router.post( "/v2/hooks/post-id-assignment", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		// Respond back pre-emptively ( and optimistically )
		res.json( {
			code: 200,
			message: "The Id assignment has been acknowledged."
		} );
		res.end();

		/* ------------------------------------------- \
		 * 1. Extract relevant data from the Request
		 \-------------------------------------------- */
		let client = req.body.client;
		let phoneNumber = req.body.phoneNumber;



		/* ----------------------- \
		 * 2. Get the Person
		 \----------------------- */
		let person = new Person( client, phoneNumber );
		try {
			await person.get();
		}
		catch ( e ) {
			return;
		}



		/* ----------------------- \
		 * 3. Trigger the Webhook
		 \------------------------ */
		let webhookEvent = new PersonAddedWebhook( client, phoneNumber );
		webhookEvent.attachData( person.__dataAtSource );
		try {
			await webhookEvent.handle();
			await person.unset( "__dataAtSource" );
		}
		catch ( e ) {}

	} );

	return router;

}
