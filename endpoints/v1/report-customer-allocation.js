
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
// Third-party packages
const { WebClient } = require( "@slack/web-api" );

// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let crm = require( `${ rootDir }/lib/crm.js` );
let comms = require( `${ rootDir }/lib/comms.js` );
let crmSettings = require( `${ environmentDir }/configuration/crm.json` );
let slackConfiguration = require( `${ environmentDir }/configuration/slack.json` );





const slack = new WebClient( slackConfiguration.accessToken );





/*
 * -/-/-/-/-/
 * Report Customer Allocation
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	router.post( "/v1/customers/reports/allocation", async function ( req, res ) {

		let client = req.body.client;
		let customerExternalId = req.body.customerExternalId;
		let salespersonId = req.body.salespersonId;
		let customerName = req.body.customerName;

		if ( ! client || ! customerExternalId || ! salespersonId || ! customerName ) {
			res.json( {
				code: 401,
				message: "Please provide the client, customer's id, the salesperson's CRM id and the customer's name."
			} );
			res.end();
			return;
		}

		let salesperson;
		try {
			salesperson = await crm.getSalespersonById( client, salespersonId );
		}
		catch ( e ) {
			res.json( {
				code: 500,
				message: "The saleperson could not be found. Try again after sometime."
			} );
			res.end();
			return;
		}
		if ( ! salesperson ) {
			res.json( {
				code: 404,
				message: `No salesperson exists with the id ${ salespersonId }.`
			} );
			res.end();
			return;
		}

		// Respond back
		res.json( { message: "The allocation will be reported." } );
		res.end();

		let salepeopleRoles = crmSettings.reporting.allocations;
		if ( ! salepeopleRoles.includes( salesperson.profile.name ) )
			return;

		// Report the allocation to the salespeople
		let clientConfiguration = require( `${ environmentDir }/configuration/clients/${ client }.json` );
		let salespersonSlackId = clientConfiguration.slack.users[ salesperson.email ];
		let message = `${ salesperson.first_name } (<@${ salespersonSlackId }>)\n_${ customerName }_ [${ customerExternalId }] has just been assigned to you.`;

		let response;
		try {
			response = await comms.postMessage( client, message );
		}
		catch ( e ) {
			await log.toUs( {
				context: "Reporting a customer's allocation to the salepeople",
				message: "\n```\n" + e.stack + "\n```"
			} );
		}

	} );

	return router;

}
