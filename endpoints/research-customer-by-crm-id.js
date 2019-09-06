
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/..";

/*
 *
 * Packages
 *
 */
// Third-party packages
let axios = require( "axios" );
let qs = require( "qs" );
// Our custom imports
let dbms = require( `${ rootDir }/lib/dbms.js` );
let datetime = require( `${ rootDir }/lib/datetime.js` );
let crm = require( `${ rootDir }/lib/crm.js` );


/*
 * -/-/-/-/-/
 * Research information on a customer, given their UID
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	router.get( "/someone", async function ( req, res ) {

		let crmExternalId = req.query.uid;

		if ( ! crmExternalId ) {
			res.status( 404 );
			res.json( { message: "Please provide the external Id of the customer." } );
			res.end();
			return;
		}

		// Fetch the customer from Cupid's database
		let databaseClient = await dbms.getClient();
		let database = databaseClient.db( "cupid" );
		let collection = database.collection( "people" );

		let person = await collection.findOne( { "meta.crmExternalId": crmExternalId } );

		if ( ! person ) {
			res.json( {
				code: 404,
				message: "Could not find any information on the customer."
			} );
			res.end();
			return;
		}

		// Make the "date of birth" field human-readable
		if ( person.dateOfBirth )
			person.dateOfBirth = datetime.formatTimestamp( person.dateOfBirth, "d/m/Y" );

		// Return the person
		res.json( { code: 200, data: { person } } );
		res.end();

	} );

	return router;

}
