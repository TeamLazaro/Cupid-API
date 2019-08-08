
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let dbms = require( `${ rootDir }/lib/dbms.js` );


/*
 * -/-/-/-/-/
 * List all the people we know of
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	router.get( "/people", async function ( req, res ) {

		let databaseClient = await dbms.getClient();
		let database = databaseClient.db( "cupid" );
		let collection = database.collection( "people" );
		let records = await collection.find( { } ).toArray();
		res.json( records );
		res.end();

	} );

	return router;

}
