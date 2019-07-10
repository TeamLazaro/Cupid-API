
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
let crm = require( "./lib/crm.js" );



/*
 * Constants declarations
 */
let httpPort = 9996;

/*
 * Set up the HTTP server and the routes
 */
let router = express.Router();
// Create an HTTP body parser for the type "application/json"
let jsonParser = bodyParser.json()
// Create an HTTP body parser for the type "application/x-www-form-urlencoded"
let urlencodedParser = bodyParser.urlencoded( { extended: true } )

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

router.options( "/people", async function ( req, res ) {
	res.header( "Access-Control-Allow-Origin", req.headers.origin );
	res.header( "Access-Control-Allow-Credentials", "true" );
	res.header( "Access-Control-Allow-Methods", "OPTIONS, POST" );
	res.header( "Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With" );
	res.sendStatus( 200 );
	// res.send( 200 );
} );

router.post( "/people", async function ( req, res ) {

	// res.header( "Access-Control-Allow-Origin", "*" );
	res.header( "Access-Control-Allow-Origin", req.headers.origin );
	res.header( "Access-Control-Allow-Credentials", "true" );

	// Respond back
	res.json( { message: "Will add a new potential customer." } );
	res.end();

	/*
	 * Add the potential customer
	 */
	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );
	// Pull the data from the request
	let phoneNumber = req.body.phoneNumber;
	let project = req.body.project;

	// But first, check if they're any existing records that match the customer
	let existingRecords = await collection.find( {
		phoneNumber,
		project
	} ).toArray();
	if ( existingRecords.length )
		return;

	// Okay, now we can go ahead and ingest the customer record
	var record = {
		createdOn: new Date(),
		phoneNumber,
		// client,
		project,
		numberIsValid: false,
		verifiedByOTP: false
	}
	await collection.insertOne( record );

} );


router.options( "/people/:phoneNumber/:project", async function ( req, res ) {
	res.header( "Access-Control-Allow-Origin", req.headers.origin );
	res.header( "Access-Control-Allow-Credentials", "true" );
	res.header( "Access-Control-Allow-Methods", "OPTIONS, POST" );
	res.header( "Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With" );
	res.sendStatus( 200 );
	// res.send( 200 );
} );
router.post( "/people/:phoneNumber/:project", async function ( req, res ) {

	// res.header( "Access-Control-Allow-Origin", "*" );
	res.header( "Access-Control-Allow-Origin", req.headers.origin );
	res.header( "Access-Control-Allow-Credentials", "true" );

	// Respond back
	res.json( { message: "Will update potential customer." } );
	res.end();

	// If there is anything to update in the first place
	if ( ! Object.keys( req.body ).length )
		return;

	// Pull data from the request
	let phoneNumber = req.params.phoneNumber;
	let project = req.params.project;

	/*
	 * Update the potential customer ( if it exists )
	 */
	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );
	let record = await collection.updateOne(
		{ phoneNumber, project },
		{ $set: req.body }
	);
	log.toConsole( record.result );

} );

router.get( "/people", async function ( req, res ) {

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );
	let records = await collection.find( { } ).toArray();
	res.json( records );
	res.end();

} );





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
