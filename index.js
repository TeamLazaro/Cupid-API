
// Standard libraries
let util = require( "util" );
let fs = require( "fs" );

// Third-party packages
let qs = require( "qs" );
let axios = require( "axios" );
let express = require( "express" );
let bodyParser = require( "body-parser" );

// Our custom imports
let log = require( "./lib/logger.js" );
let dbms = require( "./lib/dbms.js" );
let crm = require( "./lib/crm.js" )( { autoRenewAPIKey: true } );



/*
 * Constants declarations
 */
let httpPort = process.env.HTTP_PORT || 9996;

/*
 * -/-/-/-/-/-/
 * Middleware
 * -/-/-/-/-/-/
 */
// An HTTP body parser for the type "application/json"
let jsonParser = bodyParser.json()
// An HTTP body parser for the type "application/x-www-form-urlencoded"
let urlencodedParser = bodyParser.urlencoded( { extended: true } )
// Allow Pre-flight request
async function allowPreFlightRequest ( req, res ) {
	res.header( "Access-Control-Allow-Origin", req.headers.origin );
	res.header( "Access-Control-Allow-Credentials", "true" );
	res.header( "Access-Control-Allow-Methods", "OPTIONS, POST" );
	res.header( "Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With" );
	res.sendStatus( 200 );
	// res.send( 200 );
}

/*
 * -/-/-/-/-/
 * Set up the router and the routes
 * -/-/-/-/-/
 */
let router = express.Router();
// Plugging in the middleware
router.use( urlencodedParser );
router.use( jsonParser );


router.get( "/someone", async function ( req, res ) {

	/*
	 * 1. First, fetch the customer from the CRM, based on the given UID
	 */
	let uid = req.query.uid;
	if ( ! uid ) {
		res.status( 404 );
		res.json( { message: "Please provide the UID of the customer." } );
		res.end();
		return;
	}

	let customer;
	try {
		customer = await crm.getCustomerByUid( uid )
	}
	catch ( e ) {
		res.status( 404 );
		res.json( {
			message: `Could not find a customer with the UID ${ uid }.`,
			e: e.message
		} );
		res.end();
		return;
	}

	/*
	 * 2. Now, query the person with the phone number(s) and email address(es)
	 */
	let phoneNumbers = [
		customer[ "Phone" ],
		customer[ "Mobile" ],
		customer[ "Home_Phone" ],
		customer[ "Other_Phone" ],
		customer[ "Asst_Phone" ]
	]
		.filter( number => number )
		.map( number => ({ number }) );

	let emailAddresses = [
		customer[ "Email" ],
		customer[ "Secondary_Email" ]
	]
		.filter( email => email )
		.map( email => ({ address: email }) );

	let response;
	try {
		response = await axios.post( "https://api.pipl.com/search/", qs.stringify( {
			key: "bbnpv2fw7rc7swd95e4cfdmw",
			person: JSON.stringify( {
				phones: phoneNumbers,
				emails: emailAddresses
			} )
		} ) );
	}
	catch ( e ) {
		res.status( 404 );
		res.json( {
			message: `Could not find a customer with the UID ${ uid }.`,
			e: e.message
		} );
		res.end();
		return;
	}

	res.json( { data: response.data } );
	res.end();

} );

/*
 * -/-/-/-/-/
 * Add a person
 * -/-/-/-/-/
 */
router.options( "/people", allowPreFlightRequest );
router.post( "/people", async function ( req, res ) {

	// res.header( "Access-Control-Allow-Origin", "*" );
	res.header( "Access-Control-Allow-Origin", req.headers.origin );
	res.header( "Access-Control-Allow-Credentials", "true" );

	// Pull the data from the request
	let client = req.body.client;
	let interest = req.body.interest;
	let phoneNumber = req.body.phoneNumber;
	if (
		! client
			||
		! interest
			||
		! phoneNumber
	) {
		res.json( { message: "Please provide the client, person's phone number and interest." } );
		res.end();
		return;
	}

	// Respond back
	res.json( { message: "The person will be added." } );
	res.end();

	/*
	 * Add the potential customer
	 */
	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );

	// Okay, now we can go ahead and ingest the customer record
	var record = {
		meta: {
			createdOn: new Date(),
			identityVerified: false
		},
		actions: { },
		client,
		interest,
		phoneNumber
	}
	try {
		await collection.insertOne( record );
	}
	catch ( e ) {
		log.toUs( {
			context: "Adding a new person to the database",
			message: `[${ e.code }] ${ e.name } – ${ e.errmsg }`
		} );
	}

} );


/*
 * -/-/-/-/-/
 * List all the people we know of
 * -/-/-/-/-/
 */
router.get( "/people", async function ( req, res ) {

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );
	let records = await collection.find( { } ).toArray();
	res.json( records );
	res.end();

} );

/*
 * -/-/-/-/-/
 * Verify a person
 * -/-/-/-/-/
 */
router.options( "/people/verify", allowPreFlightRequest );
router.post( "/people/verify", async function ( req, res ) {

	// res.header( "Access-Control-Allow-Origin", "*" );
	res.header( "Access-Control-Allow-Origin", req.headers.origin );
	res.header( "Access-Control-Allow-Credentials", "true" );

	let client = req.body.client;
	let interest = req.body.interest;
	let phoneNumber = req.body.phoneNumber;

	if (
		! client
			||
		! interest
			||
		! phoneNumber
	) {
		res.json( { message: "Please provide the client, person's phone number and interest." } );
		res.end();
		return;
	}

	// Respond back
	res.json( { message: "The person will be verified." } );
	res.end();

	/*
	 * Verify the person
	 */
	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );

	let record = await collection.updateOne(
		{ client, interest, phoneNumber },
		{ $set: { "meta.identityVerified": true } }
	);

} );




/*
 * -/-/-/-/-/
 * Set up the server and plug-in the router
 * -/-/-/-/-/
 */
let httpServer = express().use( router ).listen( httpPort, function (  ) {
	if ( process.env.NODE_ENV != "production" )
		log.toConsole( "HTTP server is listening at " + httpPort + "." );
	if ( process.send )
		process.send( "ready" );
} );


/*
 * Handle process shutdown
 *
 * - Shut down the HTTP server.
 *
 */
process.on( "SIGINT", function ( signal, code ) {

	log.toConsole( "Shutting down HTTP server..." );
	httpServer.close();
	log.toConsole( "HTTP server has been shut down." );
	log.toConsole( "All done." );

} );
