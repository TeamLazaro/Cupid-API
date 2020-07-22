
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/../..";

/*
 *
 * Packages
 *
 */
// Third-party packages
let { URL } = require( "url" );
// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );


/*
 * -/-/-/-/-/-/-/-
 * Test a Webhook
 * -/-/-/-/-/-/-/-
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/webhook/test", middleware.allowPreFlightRequest );


	router.post( "/v2/webhook/test", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		/* ------------------------------------------- \
		 * 1. Extract relevant data from the Request
		 \-------------------------------------------- */
		let event = req.body.event;
		let address = req.body.address;
		// If the required data has not been provided
		if ( ! event || ! address ) {
			res.status( 400 );
			res.json( {
				code: 400,
				message: "Please provide an event and an HTTP(S) address."
			} );
			return;
		}



		/* ----------------------- \
		 * 2. Validate the data
		 \----------------------- */
		// a. The URL first
		let url;
		try {
			url = new URL( address );
		}
		catch ( e ) {
			// If the URL is syntactically incorrect
			return invalidInputResponse( res, "The address provided is invalid." );
		}
		// if the protocol is not HTTP(S)
		if ( ! /^https?:$/.test( url.protocol ) )
			return invalidInputResponse( res, "The address provided is invalid." );

		// b. The event
		let eventFileName = event.replace( /^\/+|\/+$/g, "" ).replace( /\/+/g, "-" );
		let eventFilePath = `${ rootDir }/lib/webhooks/${ eventFileName }.js`;
		try {
			require( eventFilePath );
		}
		catch ( e ) {
			return invalidInputResponse( res, "The event provided does not exist." );
		}



		/* ----------------------------------- \
		 * 3. Issue a request for the webhook
		 \------------------------------------ */
		// a. Get the webhook event
		let WebhookEvent = require( eventFilePath );
		// b. Respond back pre-emptively ( and optimistically )
		res.json( {
			code: 200,
			message: "A webhook will be pushed for the provided event and address."
		} );
		res.end();

		// c. Now, handle the webhook event
		if ( WebhookEvent.simulate ) {
			try {
				await WebhookEvent.simulate( { address } );
			}
			catch ( e ) {}
		}
		else {
			let webhookEvent = new WebhookEvent();
			webhookEvent.setRecipients( { address } );
			try {
				await webhookEvent.handle();
			}
			catch ( e ) {}
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
