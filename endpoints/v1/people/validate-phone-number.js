
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
let telephone = require( `${ rootDir }/lib/telephone.js` );


/*
 * -/-/-/-/-/
 * Validate a person's phone number
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/people/validate-phone-number", middleware.allowPreFlightRequest );


	router.post( "/people/validate-phone-number", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		// Pull the data from the request
		let id = req.body.id;
		if ( typeof id == "string" )
			id = id.trim();

		// If the essential details aren't provided, respond appropriately
		if ( ! id ) {
			res.json( { message: "Please provide the person's id." } );
			res.end();
			return;
		}

		/*
		 * Add the person
		 */
		let databaseClient = await dbms.getClient();
		let database = databaseClient.db( "cupid" );
		let collection = database.collection( "people" );

		let person = await collection.findOne( { _id: id } );
		if ( ! person ) {
			res.json( {
				code: 404,
				message: `No person found with the id ${ id }.`
			} );
			res.end();
			return;
		}

		/*
		 * Okay, now validate the phone number
		 */
		let phoneNumberInformation
		try {
			phoneNumberInformation = await telephone.isPhoneNumberValid( person.phoneNumber );
		}
		catch ( e ) {
			await log.toUs( {
				context: "Validating a person's phone number",
				message: `Determining if the phone number of the person ( id ${ id } ) is legit` + "\n```\n" + e.stack + "\n```"
			} );
			res.json( {
				code: 500,
				message: "Could not validate the person's phone number. Try again after sometime. If the issue still persists, please contact support.",
				details: e.stack
			} );
			res.end();
			return;
		}

		if ( phoneNumberInformation.success === false ) {
			let error = phoneNumberInformation.error;
			await log.toUs( {
				context: "Validating a person's phone number",
				message: `Determining if the phone number of the person ( id ${ id } ) is legit\n[${ e.code }] ${ e.info }`
			} );
			res.json( {
				code: 500,
				message: "Could not validate the person's phone number. Try again after sometime. If the issue still persists, please contact support.",
				details: e.stack
			} );
			return;
		}

		if ( ! phoneNumberInformation.valid ) {
			await collection.updateOne( { _id: person._id }, { $set: {
				"meta.spam": true,
				"meta.phoneNumberIsValid": false,
				"actions.validatePhoneNumber": true,
				"actions.research": true
			} } );
			res.json( {
				code: 205,
				message: "The person's phone number is not valid."
			} );
			res.end();
			return;
		}

		await collection.updateOne( { _id: person._id }, { $set: {
			"meta.phoneNumberIsValid": true,
			"actions.validatePhoneNumber": true
		} } );
		res.json( {
			code: 200,
			message: "The person's phone number is valid."
		} );
		res.end();

	} );

	return router;

}
