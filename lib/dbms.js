
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





let databaseClient;
function getClient () {

	if ( databaseClient )
		return Promise.resolve( databaseClient );

	return new Promise( function ( resolve, reject ) {
		MongoClient.connect( mongoAddress, {
			useNewUrlParser: true
		}, function ( e, client ) {
			if ( e ) {
				console.error( e.message );
				return;
			}
			log.toConsole( "Opened connection to the Mongo database." );
			databaseClient = client;
			return resolve( databaseClient );
		} );
	} );

}
getClient();





/*
 * Handle process shutdown
 *
 * - Close the connection to the database
 *
 */
process.on( "SIGINT", function () {
	if ( ! databaseClient )
		return;
	log.toConsole( "Closing connection to the Mongo database..." );
	databaseClient.close();
	log.toConsole( "Closed connection to the Mongo database." );
} );
