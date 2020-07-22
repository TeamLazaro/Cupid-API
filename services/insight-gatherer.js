#! /usr/bin/node
/*
 *
 * This script routinely gathers insights on People
 *
 */

// Constants
let rootDir = __dirname + "/..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let Clients = require( `${ rootDir }/lib/entities/Clients.js` );
let People = require( `${ rootDir }/lib/entities/People.js` );
let Webhook = require( `${ rootDir }/lib/webhook.js` );
let InsightMakerResolver = require( `${ rootDir }/lib/entities/insights/InsightMakerResolver.js` );





/*
 *
 * Handle un-caught/handled exceptions and errors
 *
 */
async function shutdownGracefully ( e ) {

	let context = "Routine assignment of ids to people.";

	if ( process.env.NODE_ENV === "production" ) {
		let message = e.toString();
		if ( e.stack )
			message += "\n```\n" + e.stack + "\n```";

		if ( log && log.toUs )
			await log.toUs( {
				context: context,
				message: message,
				data: e
			} );
	}
	else {
		console.error( e );
	}

	setTimeout( function () {
		console.log( "Terminating process right now." );
		process.exit( 1 );
	}, 1000 );

}
process.on( "uncaughtException", shutdownGracefully );
process.on( "unhandledRejection", shutdownGracefully );





( async function main () {

	// Notify PM2 that the process is ready
	if ( process.send )
		process.send( "ready" );

	let context = "Routine gathering of insights.";


	let clients = await Clients.get();
	for ( let client of clients ) {

		let insights = client.getInsights();

		for ( let insight of insights ) {

			/*
			 *
			 * ----- Get the insight's pre-requisites and query the People accordingly
			 *
			 */
			let InsightMaker = InsightMakerResolver.get( insight.slug );
			let insightCriteria = InsightMaker.getCriteria();
			let people = await People.get( insightCriteria );


			for ( let person of people ) {

				/*
				 *
				 * ----- Gather the "insight"
				 *
				 */
				let insightData
				try {
					insightData = await InsightMaker.gather( person );
				}
				catch ( e ) {
					let issue = e;
					if ( e.errors )
						issue = { code: e.code, details: e.errors }
					await log.toUs( {
						context,
						message: "Gathering insight on " + insight.name,
						data: issue
					} );
					continue;
				}

				/*
				 *
				 * ----- Store the insight for that Person
				 *
				 */
				await InsightMaker.store( insightData, person );

				/*
				 *
				 * ----- Queue a Webhook
				 *
				 */
				// typeof `null` returns "object"
				if ( insightData === null || typeof insightData !== "object" || ( ! Object.values( insightData ).length ) )
					continue;

				let resource = { clientName: client.slugName, _id: person._id };
				let webhookEvent = new Webhook( "insight/on/conversion-attribution", resource, insightData );
				try {
					await webhookEvent.addToQueue();
				}
				catch ( e ) {
					await log.toUs( {
						context,
						message: "Queuing a conversion attribution webhook",
						data: e
					} );
				}

			}

		}

	}





	/*
	 * We're done.
	 */
	process.exit( 0 );

}() );
