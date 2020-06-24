
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/../../..";
let phoneNumberRegex = /^\+\d+$/;

/*
 *
 * Packages
 *
 */
// Our custom imports
let logger = require( `${ rootDir }/lib/logger.js` );
let { successResponse, invalidInputResponse } = require( `${ rootDir }/lib/http.js` );
let Client = require( `${ rootDir }/lib/entities/Client.js` );
let Person = require( `${ rootDir }/lib/entities/Person.js` );
let PersonActivity = require( `${ rootDir }/lib/entities/PersonActivity.js` );
let Webhook = require( `${ rootDir }/lib/webhook.js` );


/*
 * -/-/-/-/-/
 * Person made Purchase
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/hooks/person-made-purchase", middleware.allowPreFlightRequest );


	router.post( "/v2/hooks/person-made-purchase", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		/* ------------------------------------------- \
		 *  Extract relevant data from the Request
		 \-------------------------------------------- */
		let clientName = req.body.client;
		let phoneNumber = req.body.phoneNumber;
		let description = req.body.description;
		let amount = req.body.amount;
		let provider = req.body.provider;	// example, PayTM, PayPal, Stripe
		let purchaseData = req.body.data;


		if (
			typeof clientName !== "string"
			|| typeof phoneNumber !== "string"
			|| typeof provider !== "string"
			|| typeof description !== "string"
			|| typeof amount !== "string"
			|| typeof purchaseData !== "object"
		) {
			invalidInputResponse( res, "Please provide all the relevant data." );
			return;
		}

		if (
			! clientName.trim()
			|| ! phoneNumberRegex.test( phoneNumber )
			|| ! provider.trim()
			|| ! description.trim()
			|| ! amount.trim()
		) {
			invalidInputResponse( res, "Please provide all the relevant data." );
			return;
		}


		/* ------------------------------ \
		 *  Respond back to the client
		 \------------------------------- */
		// pre-emptively, and optimistically
		successResponse( res, "The details of the purchase has been received and will be processed shortly." );



		/* ------------------------------------ \
		 *  Get the Person from the database
		 \------------------------------------- */
		let person = new Person( clientName, phoneNumber );
		try {
			await person.get( { id: 1, deviceIds: 1 } );
		}
		catch ( e ) {
			return;
		}



		/* -------------------------- \
		 *  Record a new Activity
		 \--------------------------- */
		let when = new Date;
		let activityData = {
			...purchaseData,
			description,
			amount,
			provider
		};
		let activity = new PersonActivity( "person/made/purchase" );
		activity
			.occurredOn( when )
			.from( "Website" )
			.associatedWith( person )
			.setServiceProvider( provider )
			.setData( activityData );

		try {
			await activity.record();
		}
		catch ( e ) {
			await logger.toUs( {
				context: "Request to acknowledge Person making a purchase",
				message: "Recording a new activity",
				data: e
			} );
		}



		/* -------------------------- \
		 *  Trigger Webhook Event
		 \--------------------------- */
		let resource = { clientName: clientName, _id: person._id };
		let webhookData = {
			...purchaseData,
			when,
			description,
			amount,
			provider
		};
		let webhookEvent = new Webhook( "person/made/purchase", resource, webhookData );
		try {
			webhookEvent.addToQueue();
		}
		catch ( e ) {
			await logger.toUs( {
				context: "Request to acknowledge Person making a purchase",
				message: "Queuing a webhook",
				data: e
			} );
		}

	} );

	return router;

}
