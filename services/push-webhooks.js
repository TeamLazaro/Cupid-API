#! /usr/bin/node
/*
 *
 * This assigns our custom Ids to all the new people
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
let Webhook = require( `${ rootDir }/lib/webhook.js` );
let Webhooks = require( `${ rootDir }/lib/entities/Webhooks.js` );





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

	let context = "Routine pushing of webhooks.";

	/*
	 *
	 * ----- Get all the webhooks that have not been pushed
	 *
	 */
	let query = {
		filter: {
			__schema: { $gte: 1 },
			_pushed: false
		},
		sort: { createdOn: 1 }
	};
	let {
		cursor,
		numberOfRecords,
		pageSize
	} = await Webhooks.get( query );

	/*
	 *
	 * ----- Push the Webhook
	 *
	 */
	while ( await cursor.hasNext() ) {

		let record = await cursor.next();
		let webhook = await Webhook.getByInternalId( record._id );

		/*
		 * Push the Webhook
		 */
		try {
			await webhook.getInstance().handle();
		}
		catch ( e ) {
			continue;
		}

		/*
		 * Mark the Webhook as "pushed"
		 */
		// We don't to update the webhook with all the mutations made in the `handle` method
		webhook.hasBeenPushed( true );
		try {
			await webhook.update();
		}
		catch ( e ) {
			await log.toUs( {
				context,
				message: `Marking a Webhook as "pushed".`,
				data: e
			} );
			return;
		}

		/*
		 * Now, remove the webhook from the queue
		 */
		try {
			await webhook.removeFromQueue();
		}
		catch ( e ) {
			await log.toUs( {
				context,
				message: `Removing a Webhook from the queue.`,
				data: e
			} );
			return;
		}

	}





	/*
	 * We're done.
	 */
	process.exit( 0 );

}() );
