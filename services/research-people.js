#! /usr/bin/node

// Constants
let rootDir = __dirname + "/..";

// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let dbms = require( `${ rootDir }/lib/dbms.js` );
let telephone = require( `${ rootDir }/lib/telephone.js` );
let people = require( `${ rootDir }/lib/people.js` );





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

	let context = "Researching people.";

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );

	/*
	 * 1. Get all the un-"Researched" people
	 */
	let timestamp__CoupleHoursAgo = new Date( Date.now() - 2 * 60 * 60 * 1000 );
	let peopleRecords = await collection.find( {
		"__schema": { $ne: 3 },
		// "actions.research": { $in: [ null, false ] }
			// has not been operated on
		"actions.research": { $ne: true },
			// does not have an error
		"meta.error": { $ne: true },
			// was added in the last two hours
		"meta.createdOn": { $gte: timestamp__CoupleHoursAgo },
	} ).sort( { "meta.createdOn": 1 } );

	/*
	 * 2. Run the people records through the research process
	 */
	while ( await peopleRecords.hasNext() ) {

		let person = await peopleRecords.next();

		/*
		 * A. Verify the phone number
		 */
		if ( ! person.actions.validatePhoneNumber ) {
			let phoneNumberInformation;
			try {
				phoneNumberInformation = await telephone.isPhoneNumberValid( person.phoneNumber );
			}
			catch ( e ) {
					// Log the error
				await log.toUs( {
					context: context,
					message: `Determining if the phone number of the person ( id ${ person._id.toString() } ) is legit\n${ e.message }` + "\n```\n" + e.stack + "\n```"
				} );
					// Update the person record with the error flag
				await collection.updateOne( { _id: person._id }, { $set: { "meta.error": true } } );
				continue;
			}
			if ( phoneNumberInformation.success === false ) {
					// Log the error
				let error = phoneNumberInformation.error;
				await log.toUs( {
					context: context,
					message: `Determining if the phone number of the person ( id ${ person._id.toString() } ) is legit\n[${ error.code }] ${ error.info }`
				} );
					// Update the person record with the error flag
				await collection.updateOne( { _id: person._id }, { $set: { "meta.error": true } } );
				continue;
			}
			if ( ! phoneNumberInformation.valid ) {
				await collection.updateOne( { _id: person._id }, { $set: {
					"meta.spam": true,
					"meta.phoneNumberIsValid": false,
					"actions.validatePhoneNumber": true,
					"actions.research": true
				} } );
				continue;
			}
			await collection.updateOne( { _id: person._id }, { $set: {
				"meta.phoneNumberIsValid": true,
				"actions.validatePhoneNumber": true
			} } );
		}

		/*
		 * B. Search for information
		 */
		let phoneNumbers = [ person.phoneNumber ].concat( ( person.contact && person.contact.otherPhoneNumbers ) || [ ] );
		let emailAddresses = [ person.emailAddress ].concat( ( person.contact && person.contact.otherEmailAddresses ) || [ ] );
		try {
			informationOnPeople = await people.getDataOnPerson( phoneNumbers, emailAddresses );
		}
		catch ( e ) {
				// Log the error
			await log.toUs( {
				context: context,
				message: `Querying information on a person ( id ${ person._id.toString() } )\n${ e.message }` + "\n```\n" + e.stack + "\n```"
			} );
				// Update the person record with the error flag
			await collection.updateOne( { _id: person._id }, { $set: { "meta.error": true } } );
			continue;
		}
		if ( informationOnPeople.people.length === 0 ) {
			// await log.toUs( {
			// 	context: context,
			// 	message: `Querying information on a person ( id ${ person._id.toString() } )\nNo information found on the person.\n${ e.message }`
			// } );
		}
		else if ( informationOnPeople.people.length > 1 ) {
			// await log.toUs( {
			// 	context: context,
			// 	message: `Querying information on a person ( id ${ person._id.toString() } )\nMore than one match found for the person.\n${ e.message }`
			// } );
			await collection.updateOne( { _id: person._id }, { $set: {
				"meta.pipl.searchPointers": informationOnPeople.people.map( person => person[ "@search_pointer" ] )
			} } );
		}
		else {
			// person = Object.assign( person, informationOnPeople.people[ 0 ] );
			await collection.updateOne( {
				_id: person._id
			}, { $set: informationOnPeople.people[ 0 ] } );
		}

		await collection.updateOne( { _id: person._id }, { $set: {
			"actions.gatherInformation": true,
			"meta.fetchedInformationOn": new Date()
		} } );

		/*
		 * C. Finally, ackowledge that the research has been complete
		 */
		await collection.updateOne( { _id: person._id }, { $set: {
			"actions.research": true
		} } );

	}

	/*
	 * We're done.
	 */
	process.exit( 0 );

}() );
