
// Exports
module.exports = main();





// Constants
let rootDir = __dirname + "/..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let Client = require( `${ rootDir }/lib/entities/Client.js` );





/*
 * -/-/-/-/-/
 * Allow pre-flight request
 * -/-/-/-/-/
 */
async function allowPreFlightRequest ( req, res ) {
	res.header( "Access-Control-Allow-Origin", req.headers.origin );
	res.header( "Access-Control-Allow-Credentials", "true" );
	res.header( "Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, DELETE" );
	res.header( "Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With" );
	res.sendStatus( 200 );
	// res.send( 200 );
}


/*
 * -/-/-/-/-/
 * Verify API key
 * -/-/-/-/-/
 */
async function verifyAPIKey ( req, res, next ) {

	let authorizationHeader = req.header( "Authorization" );
	if ( ! authorizationHeader || ! authorizationHeader.trim() )
		return invalidCredentialsResponse( res, "Access Denied" );
	let authorizationHeaderParts = authorizationHeader.split( "Bearer " );
	if ( ! authorizationHeaderParts[ 1 ] )
		return invalidCredentialsResponse( res, "Invalid Authorization header" );

	let bearerToken = authorizationHeaderParts[ 1 ];

	let client;
	try {
		client = await Client.getByAPIKey( bearerToken );
	}
	catch ( e ) {
		return invalidCredentialsResponse( res, "Incorrect Bearer token" );
	}

	let clientName = client.slugName;

	req.__client = clientName;
	next();

}

function main () {

	/*
	 *
	 * Packages
	 *
	 */
	// Third-party packages
	let express = require( "express" );
	let bodyParser = require( "body-parser" );



	// Create the router
	let router = express.Router();


	/*
	 * -/-/-/-/-/-/
	 * Middleware
	 * -/-/-/-/-/-/
	 */
	// An HTTP body parser for the type "application/json"
	let jsonParser = bodyParser.json()
	// An HTTP body parser for the type "application/x-www-form-urlencoded"
	let urlencodedParser = bodyParser.urlencoded( { extended: true } )
	// Finally, plug them in
	router.use( urlencodedParser );
	router.use( jsonParser );


	return {
		router,
		middleware: {
			allowPreFlightRequest,
			verifyAPIKey
		}
	};

}





/* ----------------- \
 * Helper functions
 \------------------ */
function invalidCredentialsResponse ( response, message ) {
	response.status( 403 );
	response.json( {
		code: 403,
		message: message
	} );
	response.end();
}
