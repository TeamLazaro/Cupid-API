
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let dbms = require( `${ rootDir }/lib/dbms.js` );


/*
 * -/-/-/-/-/
 * Verify a person
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/people/verify", middleware.allowPreFlightRequest );


	router.post( "/people/verify", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		let client = req.body.client || req.query.client;
		let phoneNumbers = req.body.phoneNumbers || req.query.phoneNumbers;

		if (
			! client
				||
			! phoneNumbers
		) {
			res.json( { message: "Please provide the client and the person's phone number." } );
			res.end();
			return;
		}

		// Respond back
		res.json( { message: "The person will be verified." } );
		res.end();

		/*
		 * Prepare the data
		 */
		phoneNumbers = phoneNumbers
			.map( phoneNumber => phoneNumber.trim() )
			.map( phoneNumber => {
				if ( ! phoneNumber.includes( "+" ) )
					return "+" + phoneNumber;
				else
					return phoneNumber;
			} );

		/*
		 * Verify the person
		 */
		let databaseClient = await dbms.getClient();
		let database = databaseClient.db( "cupid" );
		let collection = database.collection( "people" );

		let record = await collection.updateOne(
			{
				client,
				phoneNumber: { $in: phoneNumbers }
			},
			{ $set: { "meta.identityVerified": true } }
		);

	} );

	return router;

}
