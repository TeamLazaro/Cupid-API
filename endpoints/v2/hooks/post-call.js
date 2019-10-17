
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/../../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let Call = require( `${ rootDir }/lib/entities/providers/call/Call.js` );
let Client = require( `${ rootDir }/lib/entities/Client.js` );
let Person = require( `${ rootDir }/lib/entities/Person.js` );


/*
 * -/-/-/-/-/
 * Add a person
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/hooks/post-call/:provider?/:client?", middleware.allowPreFlightRequest );


	router.post( "/v2/hooks/post-call/:provider?/:client?", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		// Respond back pre-emptively ( and optimistically )
		res.json( { message: "The call log has been received and will be processed shortly." } );
		res.end();

		/* ------------------------------------------- \
		 * 1. Extract relevant data from the Request
		 \-------------------------------------------- */
		let provider = ( req.query.provider || req.params.provider || req.header( "x-provider" ) || "" ).toLowerCase();
		let callLog = req.body;



		/* ----------------------- \
		 * 2. Determine the client
		 \----------------------- */
		let clientName = ( req.query.client || req.params.client || req.header( "x-client" ) || "" ).toLowerCase();
		let client = new Client( clientName );
		try {
			await client.get();
		}
		catch ( e ) {
			await log.toUs( {
				context: `Processing the Log of a Call`,
				message: e.message + "\n\n" + JSON.stringify( callLog, null, "\t" ),
			} );
			return;
		}



		/* -------------------------- \
		 * 3. Interpret the call log
		 \--------------------------- */
		let callData = Call.parseLog( provider, callLog );
		let agent;
		let agentName;
		if ( callData.missed )
			agentName = null;
		else {
			agent = client.people.find(
				person => person.phoneNumber == callData.agentPhoneNumber
			);
			if ( agent )
				agentName = agent.name;
			else
				await log.toUs( {
					context: `Processing the Log of a Call`,
					message: `Agent with the phone number ${ callData.agentPhoneNumber } was not found.\nPerson called from the number ${ callData.phoneNumber }`
				} );
		}



		/* ----------------------------------------------- \
		 * 4. Add a Person if not already in the Database
		 \------------------------------------------------ */
		let phoneNumber = callData.phoneNumber;
		let person = new Person( client.name, phoneNumber )
						.cameFrom( "Phone", agentName )

		try {
			await person.add();
		}
		catch ( e ) {
			if ( e.code != 51 )
				await log.toUs( {
					context: `Processing the Log of a Call`,
					message: `Error outside domain logic:\n${ e.message }`
				} );
		}

	} );

	return router;

}
