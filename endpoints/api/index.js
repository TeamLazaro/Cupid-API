
/*
 *
 * Client's API routes
 *
 */
function main ( router, middleware ) {

	// Create a router
	let apiRouter = require( "express" ).Router();

	// Use the API router for all `/api/` routes
	router.use( "/api/v1/", apiRouter );

	return router;

}

module.exports = main;
