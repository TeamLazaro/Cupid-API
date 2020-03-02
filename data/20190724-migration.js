#! /usr/bin/node

// Constants
let rootDir = __dirname + "/..";

// Third-party packages
let express = require( "express" );

// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let dbms = require( `${ rootDir }/lib/dbms.js` );





( async function main () {

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );

	let people = await collection.find( { } );

	while ( await people.hasNext() ) {
		let person = await people.next();
		let newPerson = {
			_id: person._id,
			client: "LivingWalls",
			interest: person.project,
			phoneNumber: person.phoneNumber,
			meta: {
				createdOn: person.createdOn,
				identityVerified: person.verifiedByOTP
			}
		};
		let response = await collection.save( newPerson );
		console.log( response );
	}

	/*
	 * We're done.
	 */
	process.exit( 0 );

}() );
