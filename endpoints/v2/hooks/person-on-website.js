
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
let PersonActivity = require( `${ rootDir }/lib/entities/PersonActivity.js` );
let PersonOnWebsiteWebhook = require( `${ rootDir }/lib/webhooks/person-on-website.js` );


/*
 * -/-/-/-/-/-/-/-/-/-
 * Person on Website
 * -/-/-/-/-/-/-/-/-/-
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/hooks/person-on-website", middleware.allowPreFlightRequest );


	router.post( "/v2/hooks/person-on-website", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		/* ------------------------------------------- \
		 * 1. Extract relevant data from the Request
		 \-------------------------------------------- */
		let client = req.body.client;
		let phoneNumber = req.body.phoneNumber;
		// If the required data has not been provided
		if ( ! client || ! phoneNumber ) {
			res.status( 400 );
			res.json( {
				code: 400,
				message: "Please provide the phone-number and associated client."
			} );
			return;
		}

		// Optional attributes
		let deviceId = req.body.deviceId;
		let interests = req.body.interests;
		let name = req.body.name;
		let emailAddresses = req.body.emailAddresses;
		let where = req.body.where;



		/* ----------------------- \
		 * 2. Validate the data
		 \------------------------ */
		if ( ! /^\+\d+/.test( phoneNumber ) )
			return invalidInputResponse( res, "Please provide a valid phone-number." );

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



		/* ----------------------- \
		 * 3. Get the Person
		 \------------------------ */
		let person = new Person( client, phoneNumber );
		try {
			await person.get();
		}
		catch ( e ) {
			res.status( 404 );
			res.json( {
				code: 404,
				message: "Could not find a Person with the details provided."
			} );
			res.end();
			return;
		}



		/* ---------------- \
		 * 4. Respond back
		 \----------------- */
		res.status( 200 );
		res.json( {
			code: 200,
			message: "The Person's activity has been acknowledged."
		} );
		res.end();



		/* -------------------------------------- \
		 * 5. Update the Person ( if necessary )
		 \--------------------------------------- */
		let personShouldBeUpdated = person.deviceIds && ! person.deviceIds.includes( deviceId );
		// Update the in-memory Person object
		person
			.hasDeviceIds( deviceId )
			.hasEmailAddress( ...emailAddresses )
			.isInterestedIn( ...interests );
		// Update the Person in the database
		if ( personShouldBeUpdated ) {
			try {
				await person.update();
			}
			catch ( e ) {
				await log.toUs( {
					context: `Request to acknowledge Person on the website`,
					message: "Updating a Person",
					data: e
				} );
			}
		}



		/* ----------------------------------------------------------- \
		 * 6. Determine if the code that follows needs to be executed
		 \------------------------------------------------------------ */
		// A. If the Person does not have an Id
		if ( ! person.id )
			return;

		// B. If the Person was added less than 10 minutes ago
		let tenMinutes = 10 * 60 * 1000;
		if ( person.source.medium.toLowerCase() == "website" )
			if ( Date.now() - person.createdOn < tenMinutes )
				return;

		// C. If the Person's last activity was less than 10 minutes ago
		let personActivity = new PersonActivity( "person/on/website" );
		personActivity.associatedWith( person );
		let lastActivity;
		try {
			lastActivity = await personActivity.getMostRecent();
		}
		catch ( e ) {
			return;
		}
		if ( lastActivity._id )
			if ( Date.now() - lastActivity.when < tenMinutes )
				return;



		/* ------------------------- \
		 * 7. Record a new Activity
		 \-------------------------- */
		let activity = new PersonActivity( "person/on/website" );
		activity
			.associatedWith( person )
			.from( "Website" )
			.setServiceProvider( "Google Analytics" )
			.setData( {
				where: where,
				deviceId
			} );

		try {
			await activity.record();
		}
		catch ( e ) {
			await log.toUs( {
				context: "Request to acknowledge Person on the website",
				message: "Recording a new activity",
				data: e
			} );
		}



		/* ----------------------- \
		 * 8. Trigger the Webhook
		 \------------------------ */
		let webhookEvent = new PersonOnWebsiteWebhook( client );
		webhookEvent.attachData( Object.assign( { }, person, { where } ) );
		try {
			await webhookEvent.handle();
		}
		catch ( e ) {
			await log.toUs( {
				context: "Request to acknowledge Person on the website",
				message: e.message,
				data: e
			} )
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
