
// Exports
// module.exports = Environment;





// Constants
let rootDir = __dirname + "/../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let dbms = require( `${ rootDir }/lib/dbms.js` );



class Environment {

}


// Get the environment from the database
Environment.get = async function get ( projection ) {
	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "environment" );
	let query = [ { } ];
	if ( projection )
		query = query.concat( { projection: projection } );
	let environment = await collection.findOne( ...query );
	if ( ! environment )
		throw Error( "Cannot read the environment." );
	return environment;
}





module.exports = Environment;
