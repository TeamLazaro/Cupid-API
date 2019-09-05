#! /usr/bin/node
/*
 *
 * This adds/syncs people data to their respective records on the CRM.
 * This applies to records that,
 * 	1. Are not on the CRM
 * 	2. Are on the CRM but don't have the researched information
 *
 */

// Constants
let rootDir = __dirname + "/..";

// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let dbms = require( `${ rootDir }/lib/dbms.js` );
let crm = require( `${ rootDir }/lib/crm.js` );





/*
 *
 * Handle un-caught/handled exceptions and errors
 *
 */
async function shutdownGracefully ( e ) {
	let context = "There was an uncaught error or unhandled rejection";
	let message = e.toString();
	if ( e.stack )
		message += "\n```\n" + e.stack + "\n```";
	await log.toUs( {
		context: context,
		message: message
	} );
	console.error( context + "\n" + message );
	setTimeout( function () {
		console.log( "Terminating process right now." );
		process.exit( 1 );
	}, 1000 );
}
process.on( "uncaughtException", shutdownGracefully );
process.on( "unhandledRejection", shutdownGracefully );





( async function main () {

	let context = "Routine syncing of people onto the CRM.";

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );

	/*
	 * 1. Get all the "Researched" people
	 */
	let timestamp__CoupleHoursAgo = new Date( Date.now() - 2 * 60 * 60 * 1000 );
	let peopleRecords = await collection.find( {
			// has not been operated on
		"actions.syncToCRM": { $ne: true },
			// is not spam
		"meta.spam": { $ne: true },
			// does not have an error
		"meta.error": { $ne: true },
			// was added in the last two hours
		"meta.createdOn": { $gte: timestamp__CoupleHoursAgo },
			// has been researched
		"actions.research": true,
	} ).sort( { "meta.createdOn": 1 } );

	/*
	 * 2. Add them to the CRM
	 */
	while ( await peopleRecords.hasNext() ) {

		let person = await peopleRecords.next();

		/*
		 * A. Does the person already exist on the CRM? Do we have the person's ids?
		 */
		let phoneNumbers = [ person.phoneNumber ].concat( person.contact && person.contact.otherPhoneNumbers || [ ] );
		let customer;
		try {
			customer = await crm.getCustomerByPhoneNumbers( person.client, phoneNumbers );
		}
		catch ( e ) {
				// Log the error
			await log.toUs( {
				context: `Querying person ( id ${ person._id.toString() } ) on the CRM by their phone numbers`,
				message: context + "\n```\n" + e.stack + "\n```"
			} );
				// Update the person record with the error flag
			await collection.updateOne( { _id: person._id }, { $set: { "meta.error": true } } );
			continue;
		}

		// If the person does exist,
		if ( customer ) {
				// copy over the ids
			await collection.updateOne( { _id: person._id }, { $set: {
				"meta.identityVerified": true,
				"meta.onCRM": true,
				"meta.crmInternalId": customer.internalId,
				"meta.crmExternalId": customer.externalId || ""
			} } );
				// sync the research data we've gathered to the customer record
			let otherInformation = crm.getOtherInformationAsString( person );
			try {
				await crm.updateCustomerByInternalId( person.client, customer.internalId, {
					Description: `${ otherInformation }\n\n${ customer.Description || "" }`
				} );
				await collection.updateOne( { _id: person._id }, { $set: { "actions.syncToCRM": true } } );
			}
			catch ( e ) {
					// Log the error
				await log.toUs( {
					context: `Adding research data to person ( id ${ person._id.toString() } ) on the CRM`,
					message: context + "\n```\n" + e.stack + "\n```"
				} );
					// Update the person record with the error flag
				await collection.updateOne( { _id: person._id }, { $set: { "meta.error": true } } );
			}
				// move on to the next person
			continue;
		}

		/*
		 * B. Add the person to the CRM
		 */
		try {
			customer = await crm.addCustomer( person );
		}
		catch ( e ) {
				// Log the error
			await log.toUs( {
				context: `Adding a person ( id ${ person._id.toString() } ) to the CRM`,
				message: context + "\n```\n" + e.stack + "\n```"
			} );
				// Update the person record with the error flag
			await collection.updateOne( { _id: person._id }, { $set: { "meta.error": true } } );
			continue;
		}

		// Copy over the ids ( internal and external )
		await collection.updateOne( { _id: person._id }, { $set: {
			"meta.crmInternalId": customer.internalId,
			"meta.crmExternalId": customer.externalId || ""
		} } );

		/*
		 * B. Sync our researched information to the customer record
		 */
		let otherInformation = crm.getOtherInformationAsString( person );
		try {
			if ( otherInformation )
				await crm.updateCustomerByInternalId( person.client, customer.internalId, { Description: otherInformation } );
			await collection.updateOne( { _id: person._id }, { $set: { "actions.syncToCRM": true } } );
		}
		catch ( e ) {
				// Log the error
			await log.toUs( {
				context: `Adding research data to person ( id ${ person._id.toString() } ) on the CRM`,
				message: context + "\n```\n" + e.stack + "\n```"
			} );
				// Update the person record with the error flag
			await collection.updateOne( { _id: person._id }, { $set: { "meta.error": true } } );
			continue;
		}

		/*
		 * C. Finally, ackowledge that the persistence to the CRM is complete
		 */
		await collection.updateOne( { _id: person._id }, { $set: {
			"meta.onCRM": true,
			"actions.addToCRM": true
		} } );

	}

	/*
	 * We're done.
	 */
	process.exit( 0 );

}() );
