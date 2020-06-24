
/*
 *
 * This module has functions to handle data in JSON files
 *
 */

module.exports = {
	getClient
};





// Constants
let mongoAddress = "mongodb://localhost:27017";
let databaseName = "cupid";

// Third-party packages
let { MongoClient } = require( "mongodb" );

// Our custom imports
let log = require( "./logger.js" );





let databaseClientPromise = new Promise( function ( resolve, reject ) {
		MongoClient.connect( mongoAddress, {
			useNewUrlParser: true
		}, function ( e, client ) {
			if ( e ) {
				console.error( e.message );
				return reject( e );
			}
			log.toConsole( "Opened connection to the Mongo database." );
			return resolve( client );
		} );
	} )
	.then( function ( client ) {
		return setupSchemaAndConstraints( client );
	} )

function getClient () {
	return databaseClientPromise;
}



/*
 *
 * Setup the database schemas and constraints and indexes and the like
 *
 */
async function setupSchemaAndConstraints ( client ) {
	await client.db( databaseName ).collection( "environment" );
	await client.db( databaseName ).collection( "clients" );
	await client.db( databaseName ).collection( "people" ).createIndex( {
		client: 1, phoneNumber: 1
	}, { unique: true } );
	await client.db( databaseName ).collection( "people-activity" );
	await client.db( databaseName ).collection( "logs--calls" ).createIndex( {
		__expireAt: 1
	}, { expireAfterSeconds: 0 } );
	await client.db( databaseName ).collection( "webhooks-dumpyard" );
	// await client.db( databaseName ).collection( "people--timeline" ).createIndex( {
	// 	client: 1, externalId: 1, salespersonId: 1, ddmmyyyy: 1
	// }, { unique: true } );
	return client;
}





/*
 * Handle process shutdown
 *
 * - Close the connection to the database
 *
 */
async function shutdownGracefully ( e ) {
	log.toConsole( e );
	try {
		let databaseClient = await getClient();
		log.toConsole( "Closing connection to the Mongo database..." );
		databaseClient.close();
		log.toConsole( "Closed connection to the Mongo database." );
	}
	catch ( e ) {
		log.toConsole( e );
		return;
	}
}
process.on( "SIGINT", shutdownGracefully );
process.on( "uncaughtException", shutdownGracefully );
process.on( "unhandledRejection", shutdownGracefully );
