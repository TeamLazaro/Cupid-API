#! /usr/bin/node
/*
 *
 * This assigns our custom Ids to all the new people
 *
 */

// Constants
let rootDir = __dirname + "/..";

// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let Person = require( `${ rootDir }/lib/entities/Person.js` );
let People = require( `${ rootDir }/lib/entities/People.js` );
let Client = require( `${ rootDir }/lib/entities/Client.js` );





/*
 *
 * Handle un-caught/handled exceptions and errors
 *
 */
async function shutdownGracefully ( e ) {
	let context = "Routine assignment of ids to people.";
	let message = e.toString();
	if ( e.stack )
		message += "\n```\n" + e.stack + "\n```";
	await log.toUs( {
		context: context,
		message: message,
		data: e
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

	let context = "Routine assignment of ids to people.";


	/*
	 * 1. Get all people who don't have ids
	 */
	let nowTimestamp = Date.now();
	let oneMinute = 60 * 1000;

	let query = {
		filter: {
			__schema: { $gte: 3 },
			id: { $exists: false },
			createdOn: {
				$gte: new Date( nowTimestamp - 60 * oneMinute ),
				// because we need other Person attributes that are added post creation
				$lte: new Date( nowTimestamp - 0.5 * oneMinute )
			}
		},
		sort: { client: 1, createdOn: 1 }
	};
	let projection = {  };
	let {
		cursor,
		numberOfRecords,
		pageSize
	} = await People.get( query, projection );



	/*
	 * 2. Assign them ids
	 */
	let client;
	while ( await cursor.hasNext() ) {

		let personRecord = await cursor.next();

		/*
		 * A. Get the client
		 */
		// If the client variable has not been set
			// or if the client of the person is different from what is set
		if ( ! client )
			client = new Client( personRecord.client );
		else if ( client.slugName != personRecord.client )
			client = new Client( personRecord.client );

		if ( ! client._id ) {
			try {
				await client.get();
			}
			catch ( e ) {
				await log.toUs( {
					context: context,
					message: e.message
				} );
				continue;
			}
		}

		/*
		 * B. Assign an Id to the Person
		 */
		let internalPersonId = personRecord._id;
		let person = new Person( personRecord.client, personRecord.phoneNumber );
		person._id = internalPersonId;
		let externalPersonId = await client.getIdForPerson();
		person.setId( externalPersonId );
		try {
			await person.update();
		}
		catch ( e ) {
			await log.toUs( {
				context,
				message: "Failed to update a Person record with the new Id",
				data: e
			} );
			return;
		}

	}





	/*
	 * We're done.
	 */
	process.exit( 0 );

}() );
