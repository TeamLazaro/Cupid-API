
// Third-party packages
let express = require( "express" );

// Our custom imports
let log = require( "./lib/logger.js" );
let router = require( "./endpoints/index.js" );
let dbms = require( "./lib/dbms.js" );
	// Even though it's not used here, its just used to setup auto-renewal
let crm = require( "./lib/crm.js" );



/*
 * Constants
 */
let httpPort = process.env.HTTP_PORT || 9996;

/*
 * -/-/-/-/-/
 * Set up the HTTP API server and plug-in the router
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
