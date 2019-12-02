
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/../../..";

/*
 *
 * Packages
 *
 */
// Third-party packages
let { DateTime } = require( "luxon" );
let { ObjectId } = require( "mongodb" );
// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let Person = require( `${ rootDir }/lib/entities/Person.js` );


/*
 * -/-/-/-/-/-/-/-/-/-/-/-
 * Get people or a person
 * -/-/-/-/-/-/-/-/-/-/-/-
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( /*/api/v1*/"/people/:id", middleware.allowPreFlightRequest );


	router.get( /*/api/v1*/"/people/:id", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );


		/* ------------------------------------------- \
		 * 1. Get the Client name
		 \-------------------------------------------- */
		let client = req.__client;



		/* ------------------------------------------- \
		 * 2. Extract relevant data from the Request
		 \-------------------------------------------- */
		let personId = req.params.id;
		// If the required data has not been provided
		if ( ! personId ) {
			res.status( 400 );
			res.json( {
				code: 400,
				message: "Please provide a Person's Id."
			} );
			return;
		}



		/* ----------------------- \
		 * 2. Validate the data
		 \------------------------ */
		if ( ! [ "string", "number" ].includes( typeof personId ) )
			return invalidInputResponse( res, "Please provide a valid Id." );

		personId = personId.toString();



		/* ----------------------- \
		 * 3. Build the DB query
		 \------------------------ */
		let person;
		let projection = {
			// _id: -1,
			createdOn: 1,
			id: 1,
			phoneNumber: 1,
			"source.medium": 1,
			"source.point": 1,
			interests: 1,
			verification: 1,
			emailAddresses: 1
		};

		try {
			person = await Person.getById( personId, client, projection );
		}
		catch ( e ) {
			return noDataFoundResponse( res, "No person with the given Id was found." );
		}

		// Re-shape the data
		person = [ person ]
			.map( function ( person ) {
				person.isVerified = false;
				if ( person.verification && person.verification.isVerified )
					person.isVerified = person.verification.isVerified;
				delete person.verification;
				delete person._id;
				return person;
			} )[ 0 ];



		/* ---------------- \
		 * 4. Respond back
		 \----------------- */
		let responsePayload = {
			code: 200,
			data: person
		}

		res.json( responsePayload );
		res.end();

	} );

	return router;

}



/* ----------------- \
 * Helper functions
 \------------------ */
function invalidInputResponse ( response, message ) {
	response.status( 422 );
	response.json( {
		code: 422,
		message: message
	} );
	response.end();
}

function noDataFoundResponse ( response, message ) {
	response.status( 404 );
	response.json( {
		code: 404,
		message: message
	} );
	response.end();
}
