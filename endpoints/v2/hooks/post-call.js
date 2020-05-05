
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
let logger = require( `${ rootDir }/lib/logger.js` );
let { successResponse, invalidInputResponse } = require( `${ rootDir }/lib/http.js` );
let Log = require( `${ rootDir }/lib/entities/Log.js` );
let Call = require( `${ rootDir }/lib/entities/providers/call/Call.js` );
let Analytics = require( `${ rootDir }/lib/entities/providers/analytics/Analytics.js` );
let Client = require( `${ rootDir }/lib/entities/Client.js` );
let Person = require( `${ rootDir }/lib/entities/Person.js` );
let PersonActivity = require( `${ rootDir }/lib/entities/PersonActivity.js` );
let PersonPhonedWebhook = require( `${ rootDir }/lib/webhooks/person-phoned.js` );


/*
 * -/-/-/-/-/
 * Add a person
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/hooks/post-call/:provider?/:client?", middleware.allowPreFlightRequest );


	router.post( "/v2/hooks/post-call/:provider?/:client?", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		/* ------------------------------------------- \
		 *  Extract relevant data from the Request
		 \-------------------------------------------- */
		let provider = ( req.query.provider || req.params.provider || req.header( "x-provider" ) || "" ).toLowerCase();
		let clientName = ( req.query.client || req.params.client || req.header( "x-client" ) || "" ).toLowerCase();
		let callLog = Object.assign( { }, req.body, req.query );



		/* ------------------------ \
		 *  Determine the client
		 \------------------------- */
		if ( clientName.trim() === "" )
			return invalidInputResponse( res, "No client name was provided." );

		let client = new Client( clientName );
		try {
			await client.get();
		}
		catch ( e ) {
			await logger.logToUs( {
				context: `Processing the Log of a Call`,
				message: e.message + "\n\n" + JSON.stringify( callLog, null, "\t" ),
			} );
			invalidInputResponse( res, "No record of the provided client is present." );
			return;
		}



		/* ------------------------------------------- \
		 *  Determine the Call Provider
		 \-------------------------------------------- */
		if ( provider.trim() === "" )
			return invalidInputResponse( res, "No IVR provider name was provided." );
		try {
			Call.getProvider( provider );
		}
		catch ( e ) {
			await logger.logToUs( {
				context: `Processing the Log of a Call`,
				message: e.message,
			} );
			invalidInputResponse( res, `The provider "${ provider }" is not supported.` );
			return;
		}



		/* ------------------------------ \
		 *  Respond back to the client
		 \------------------------------- */
		// pre-emptively, and optimistically
		successResponse( res, "The call log has been received and will be processed shortly." );



		/* -------------------------- \
		 *  Store the raw call log
		 \--------------------------- */
		try {
			await ( new Log( "Calls", callLog ) ).add();
		}
		catch ( e ) {}


		/* -------------------------- \
		 *  Interpret the call log
		 \--------------------------- */
		let callData = Call.parseLog( provider, callLog );

		// If the call came for another number; i.e. not the IVR number of the client
		// 	then do not continue
		// let telephonyProvider = client.providers.telephony.find( providerObject => {
		// 	return providerObject.name.toLowerCase() == provider;
		// } );
		// if ( telephonyProvider.phoneNumber != callData.ivrNumber )
		// 	return;
		// Derive the name of the agent holding the phone number
		// 	( disabled for now as it's hard to be accurate )
		// if ( callData.missed )
		// 	callData.agentName = null;
		// else {
		// 	let agent = client.people.find(
		// 		person => person.phoneNumber == callData.agentPhoneNumber
		// 	);
		// 	if ( agent )
		// 		callData.agentName = agent.name;
		// 	else if ( /^\+?\d+$/.test( callData.agentPhoneNumber ) ) {
		// 		await logger.logToUs( {
		// 			context: `Processing the Log of a Call`,
		// 			message: `Agent with the phone number ${ callData.agentPhoneNumber } was not found.\nPerson called from the number ${ callData.phoneNumber }`
		// 		} );
		// 	}
		// }



		/* ----------------------------------------------- \
		 *  Add a Person if not already in the Database
		 \------------------------------------------------ */
		let phoneNumber = callData.phoneNumber;
		// let sourcePoint = callData.agentName || callData.agentPhoneNumber;
		let sourcePoint = callData.agentPhoneNumber;
		let person = new Person( client.slugName, phoneNumber )
						.cameFrom( "Phone", sourcePoint )
						.setSourceProvider( provider )
						.setSourceProviderData( {
							callId: callData.id,
							recordingURL: callData.recordingURL
						} )

		let personAlreadyExists = false;
		try {
			await person.add();
		}
		catch ( e ) {
			if ( e.code != 51 )
				await logger.logToUs( {
					context: `Processing the Log of a Call`,
					message: `Error outside domain logic:\n${ e.message }`
				} );
			personAlreadyExists = true;
		}



		/* ------------------------------------ \
		 *  Get the Person from the database
		 \------------------------------------- */
		try {
			await person.get( { id: 1, deviceIds: 1 } );
		}
		catch ( e ) {
			await logger.toUs( {
				context: "Request to acknowledge Person calling in",
				message: "Fetching the Person from the database",
				data: e
			} );
		}



		/* -------------------------- \
		 *  Record a new Activity
		 \--------------------------- */
		let activity = new PersonActivity( "person/phoned/" );
		activity
			.occurredOn( callData.startTime )
			.from( "Phone" )
			.associatedWith( person )
			.setServiceProvider( provider )
			.setData( {
				id: callData.id,
				agentPhoneNumber: callData.agentPhoneNumber,
				recordingURL: callData.recordingURL || null
			} );

		try {
			await activity.record();
		}
		catch ( e ) {
			await logger.toUs( {
				context: "Request to acknowledge Person calling in",
				message: "Recording a new activity",
				data: e
			} );
		}



		/* ------------------------------------- \
		 *  Track this activity for Analytics
		 \-------------------------------------- */
		// A. Get the person's Ids ( if available )
		let personId = person.id;
		let personDeviceId = person.deviceIds && person.deviceIds[ 0 ];

		// B. Iterate over all the registered analytics providers
		let analyticsProviders = client.providers.analytics || [ ];
		for ( let provider of analyticsProviders ) {
			let Service = Analytics.getService( provider.name );
			let tracker = new Service( provider.api, personId, personDeviceId );
			// C. Log the activity ( and conversion if required )
			try {
				// Simply log the phone call
				await tracker.logPhoneCall( callData );

				// Log a "conversion" **if** the person **did not** already exist
				if ( ! personAlreadyExists ) {
					// let conversionURLFragment = `phone/${ callData.agentName || callData.agentPhoneNumber || "missed" }`;
					let conversionURLFragment = `phone/${ callData.agentPhoneNumber || "missed" }`;
					await tracker.logConversion( conversionURLFragment, {
						sourceMedium: "phone"
					} );
				}
			}
			catch ( e ) {
				await logger.logToUs( {
					context: `Logging a call analytics service "${ provider.name }"`,
					message: `Error outside domain logic:\n${ e.message }`
				} );
			}
		}



		/* ------------------------- \
		 *  Trigger Webhook Event
		 \-------------------------- */
		if ( personAlreadyExists ) {
			let webhookEvent = new PersonPhonedWebhook( person.client, person.phoneNumber );
			webhookEvent.attachData( callData );
			try {
				await webhookEvent.handle();
			}
			catch ( e ) {}
		}
		else {
			person.__dataAtSource = callData;
			try {
				await person.update();
			}
			catch ( e ) {}
		}

		try {
			await Person.verify( person, "Phone" );
		}
		catch ( e ) {
			await logger.toUs( {
				context: "Endpoint: /v2/hooks/post-call",
				message: "Verifying Person >> " + e.message,
				data: e
			} );
		}

	} );

	return router;

}
