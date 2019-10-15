
// Exports
module.exports = main;





// Constants
let rootDir = `${ __dirname }/../..`;
let environmentDir = `${ rootDir }/environment`;





/*
 * -/-/-/-/-/
 * Report Customer Allocation
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	router.all( "/v1/status", async function ( req, res ) {

		res.json( {
			code: 200,
			message: "Cupid is okay.",
			method: req.method
		} );
		res.end();

	} );

	return router;

}
