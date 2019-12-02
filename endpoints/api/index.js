
/*
 *
 * Client's API routes
 *
 */
function main ( router, middleware ) {

	// Create a router
	let apiRouter = require( "express" ).Router();


	apiRouter.use( middleware.verifyAPIKey );

	// GET /api/v1/people/activities
	apiRouter = require( "./v1/get-people-activities.js" )( apiRouter, middleware );

	// GET /api/v1/people/:id/activities
	apiRouter = require( "./v1/get-person-activities.js" )( apiRouter, middleware );

	// GET /api/v1/people/:id
	apiRouter = require( "./v1/get-person.js" )( apiRouter, middleware );

	// GET /api/v1/people
	apiRouter = require( "./v1/get-people.js" )( apiRouter, middleware );

	// Use the API router for all `/api/` routes
	router.use( "/api/v1/", apiRouter );

	return router;

}

module.exports = main;
