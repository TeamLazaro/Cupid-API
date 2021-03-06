#! /usr/bin/node
/*
 *
 * This posts customer research data to the salespeople.
 *
 */

// Constants
let rootDir = __dirname + "/..";
let slack__ConfigurationFilename = rootDir + "/environment/configuration/slack.json";

// Third-party packages
const { WebClient } = require( "@slack/web-api" );

// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let dbms = require( `${ rootDir }/lib/dbms.js` );
let slackConfiguration = require( slack__ConfigurationFilename );





const slack = new WebClient( slackConfiguration.accessToken );





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

	let context = "Routine introduction of people to the salepeople.";

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );

	/*
	 * 1. Get all the "Researched" people
	 */
	let timestamp__CoupleHoursAgo = new Date( Date.now() - 2 * 60 * 60 * 1000 );
	let peopleRecords = await collection.find( {
			// has not been operated on
		"actions.introduceToSalespeople": { $ne: true },
			// does not have an error
		"meta.error": { $ne: true },
			// was added in the last two hours
		"meta.createdOn": { $gte: timestamp__CoupleHoursAgo },
			// is on the CRM
		"meta.onCRM": true,
			// minimum info requirements
		"name": { $exists: true },
		"career": { $exists: true, $ne: [ ] }
	} ).sort( { "meta.createdOn": 1 } );

	/*
	 * 2. Introduce them
	 */
	while ( await peopleRecords.hasNext() ) {

		let person = await peopleRecords.next();

		/*
		 * A. Prepare the information
		 */
		let lengthOfName = person.name.length;
		let yearsOfExperience;
		if ( person.beganCareerOn )
			yearsOfExperience = ( new Date ).getFullYear() - person.beganCareerOn.getFullYear();
		else
			yearsOfExperience = "n/a";

		let image;
		let imageURL;
		if ( person.images && person.images.length )
			imageURL = person.images[ 0 ];

		let linkedInPlace;
		if ( person.onTheInteret )
			linkedInPlace = person.onTheInteret.find( function ( place ) {
				return place.name.toLowerCase() == "linkedin";
			} );


		/*
		 * B. Prepare the message
		 */
		let messageBody = [ ];
		if ( imageURL )
			messageBody.push( {
				type: "image",
				image_url: `https://slack-imgs.com/?c=1&o1=ro&url=${ encodeURIComponent( imageURL ) }`,
				alt_text: "person's face or lack of"
			} );

		messageBody.push( {
			type: "section",
			text: {
				type: "mrkdwn",
				text: "\n"
						+ person.name
						+ "\n"
						+ "- ~".repeat( lengthOfName / 2 )
						+ "\n"
						+ "UID: " + person.meta.crmExternalId
						+ "\n"
						+ "_" + yearsOfExperience + " years experience_"
						+ "\n"
						+ person.career[ 0 ]
			}
		} )

		messageBody.push( { type: "divider" } );

		if ( linkedInPlace )
			messageBody.push( {
				type: "actions",
				// block_id: "actionblock789",
				elements: [
					{
						type: "button",
						text: {
							type: "plain_text",
							text: "LinkedIn"
						},
						url: linkedInPlace.url
					}
				]
			} );


		/*
		 * C. Send out a nice little card to the salepeople
		 */
		let response;
		try {
			response = await slack.chat.postMessage( {
				channel: slackConfiguration.publicChannel.id,
				blocks: messageBody
			} );
		}
		catch ( e ) {
			await log.toUs( {
				context: "Introducing a customer to the salepeople",
				message: context + "\n```\n" + e.stack + "\n```"
			} );
			await collection.updateOne( { _id: person._id }, { $set: { "meta.error": true } } );
			continue;
		}

		/*
		 * D. Finally, ackowledge that the persistence to the CRM is complete
		 */
		await collection.updateOne( { _id: person._id }, { $set: {
			"actions.introduceToSalespeople": true
		} } );

	}

	/*
	 * We're done.
	 */
	process.exit( 0 );

}() );
