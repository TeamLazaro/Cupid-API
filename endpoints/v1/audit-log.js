
/*
 *
 * All usage on the CRM is passed to this route.
 * But there's things that we **don't** want, like:
 * 	- Actions made by the Cupid user
 *
 */

// Exports
module.exports = main;





// Constants
let rootDir = `${ __dirname }/../..`;
let environmentDir = `${ rootDir }/environment`;

/*
 *
 * Packages
 *
 */
// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let utils = require( `${ rootDir }/lib/utils.js` );
let datetime = require( `${ rootDir }/lib/datetime.js` );
let dbms = require( `${ rootDir }/lib/dbms.js` );
let clients = require( `${ environmentDir }/clients/clientele.json` );
clients = clients.map( client => {
	return {
		...client,
		...require( `${ environmentDir }/clients/${ client.name }.json` )
	};
} );





/*
 * -/-/-/-/-/
 * Report Customer Allocation
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	router.post( "/v1/logs/customers", async function ( req, res ) {

		let responseBody = {
			code: 200,
			message: "Received the information."
		};

		let data = req.body;

		let auditTrail = {
			__schemaVersion: 1,
			client: data.client,
			externalId: data.externalId,
			salespersonId: data.salespersonId,
			when: new Date(),
			ddmmyyyy: datetime.getTimestamp( "d/m/Y", { timezone: "IST" } ),
			action: data.action
		}

		if ( auditTrail.action == "modify" ) {
			if ( data.modifiedBy == clients[ auditTrail.client ].cupidUser ) {
				res.json( responseBody );
				res.end();
				return;
			}
			// auditTrail.fieldName = data.fieldName;
			// auditTrail.fieldValue = data.fieldValue;
		}
		else if ( auditTrail.action == "create" )
			auditTrail.resource = data.resource;

		// if ( data.provider == "Zoho" )
		await dbms.add( "people--timeline", auditTrail );

		// await log.toUs( {
		// 	context: "Audit Log",
		// 	message: "\n```\n" + JSON.stringify( data, null, "\t" ) + "\n```"
		// } );

		res.json( responseBody );
		res.end();

	} );

	return router;

}
