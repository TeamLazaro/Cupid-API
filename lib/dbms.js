
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
 * Handle process shutdown
 *
 * - Close the connection to the database
 *
 */
function setupSchemaAndConstraints ( client ) {
	client.db( databaseName ).collection( "people" ).createIndex( {
		client: 1, interestedIn: 1, phoneNumber: 1
	}, { unique: true } );
	return client;
}





/*
 * Handle process shutdown
 *
 * - Close the connection to the database
 *
 */
process.on( "SIGINT", async function () {
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
} );
