
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
let dbms = require( `${ rootDir }/lib/dbms.js` );


/*
 * -/-/-/-/-/
 * Add a person
 *	The source of the person can be from the Website or the CRM.
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/people", middleware.allowPreFlightRequest );


	router.post( "/people", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		// Pull the data from the request
		let client = req.body.client || req.query.client;
		let interest = req.body.interest || req.query.interest;
		let phoneNumber = req.body.phoneNumber || req.query.phoneNumber;
		let clientId = req.body.clientId || req.query.clientId;
			// Who initiated this request?
		let initiator = req.body.initiator || req.query.initiator;
			let externalId = req.body.externalId || req.query.externalId;
				externalId = externalId && externalId.trim();
			let internalId = req.body.internalId || req.query.internalId;
				internalId = internalId && internalId.trim();

		// If the essential details aren't provided, respond appropriately
		if (
			! client
				||
			! interest
				||
			! phoneNumber
		) {
			res.json( { message: "Please provide the client, person's phone number and interest." } );
			res.end();
			return;
		}

		if ( initiator )
			await log.toUs( {
				context: `Adding a person to the database`,
				message: "A request to add a person came in from the " + initiator,
			} );

		// If the person is coming from the CRM, and the ids are not provided
		if (
			initiator == "crm"
				&&
			(
				! externalId
					||
				! internalId
			)
		) {
			res.json( { message: "Please provide the record's internal and external ID." } );
			res.end();
			return;
		}

		// Respond back pre-emptively
		res.json( { message: "The person will be added." } );
		res.end();

		/*
		 * Add the person
		 */
		let databaseClient = await dbms.getClient();
		let database = databaseClient.db( "cupid" );
		let collection = database.collection( "people" );

		// Sanitize and assemble the data
		phoneNumber = phoneNumber.trim();
		if ( ! phoneNumber.includes( "+" ) )
			phoneNumber = "+" + phoneNumber;

		// Okay, now we can go ahead and ingest the customer record
		var record = {
			meta: {
				createdOn: new Date()
			},
			actions: { },
			client,
			interest,
			phoneNumber
		}
		if ( clientId )
			record.meta.clientIds = [ clientId ];
		if ( initiator == "crm" ) {
			Object.assign( record.meta, {
				source: "CRM",
				identityVerified: true,
				onCRM: true,
				crmInternalId: internalId,
				crmExternalId: externalId,
			} );
		}
		try {
			await collection.insertOne( record );
		}
		catch ( e ) {
			// If the record already exists
			if ( e.code == 11000 ) {
				// If the request came from the CRM, we assume it's "verified"
				if ( initiator == "crm" ) {
					// Hence, simply mark the person as "verified"
					await collection.updateOne( {
						client, phoneNumber
					}, { $set: {
						"meta.identityVerified": true,
						"meta.onCRM": true,
						"meta.crmInternalId": internalId,
						"meta.crmExternalId": externalId
					} } );
				}
				// If a client Id is present, then add it to the list
				else if ( clientId ) {
					await collection.updateOne( {
						client, phoneNumber
					}, { $addToSet: { "meta.clientIds": clientId } } );
					// Restrict the number of client ids to the 10 most recent
					// await collection.updateOne( {
					// 	client, phoneNumber
					// }, { $push: {
					// 	"meta.clientIds": { $each: [ ], $slice: -10 }
					// } } );
				}
			}
			else
				await log.toUs( {
					context: "Adding a new person to the database",
					message: `[${ e.code }] ${ e.name } – ${ e.errmsg }`
				} );
		}

	} );

	return router;

}
