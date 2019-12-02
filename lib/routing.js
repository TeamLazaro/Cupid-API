
// Exports
module.exports = main();





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
			allowPreFlightRequest
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
