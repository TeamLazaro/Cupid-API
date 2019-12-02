
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
let PersonActivity = require( `${ rootDir }/lib/entities/PersonActivity.js` );


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



		/* ------------------------- \
		 * 3. Record a new Activity
		 \-------------------------- */
		let source__event__Map = {
			phone: "person/phoned/",
			website: "person/on/website"
		};
		let event = source__event__Map[ person.source.medium.toLowerCase() ];
		let activity = new PersonActivity( event );
		activity.associatedWith( person );
		// Set the service provider
		if ( person.source.provider )
			activity.setServiceProvider( person.source.provider );
		// Set event-related data
		if ( event == "person/phoned/" ) {
			activity
				.from( "Phone" )
				.setData( {
					id: person.source.data.callId,
					agentPhoneNumber: person.source.point || null,
					callRecording: person.source.data.recordingURL || null
				} );
		}
		else if ( event == "person/on/website" ) {
			activity
				.from( "Website" )
				.setData( {
					deviceId: person.deviceIds && person.deviceIds[ 0 ],
					where: person.source.point
				} );
		}

		try {
			await activity.record();
		}
		catch ( e ) {
			await log.toUs( {
				context: "Post Id Assignment Hook",
				message: "Recording a new activity",
				data: e
			} );
		}



		/* ----------------------- \
		 * 4. Trigger the Webhook
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
