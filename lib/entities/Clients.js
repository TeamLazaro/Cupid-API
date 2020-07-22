
// Exports
// module.exports = Clients;





// Constants
let rootDir = __dirname + "/../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let dbms = require( `${ rootDir }/lib/dbms.js` );
let Client = require( `${ rootDir }/lib/entities/Client.js` );



class Clients {
}


// Get client from the database
Clients.get = async function get ( projection ) {

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "clients" );

	let query = [ { } ];
	if ( projection )
		query = query.concat( { projection: projection } );

	let clients = [ ];
	let cursor = await collection.find( ...query );
	while ( await cursor.hasNext() ) {
		let record = await cursor.next();
		let client = new Client( record.slugName );
		client = Object.assign( client, record );
		clients.push( client );
	}

	return clients;

}





module.exports = Clients;
