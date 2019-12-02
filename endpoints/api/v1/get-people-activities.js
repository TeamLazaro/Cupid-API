
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/../../..";

/*
 *
 * Packages
 *
 */
// Third-party packages
let { DateTime } = require( "luxon" );
let { ObjectId } = require( "mongodb" );
// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
// let datetime = require( `${ rootDir }/lib/datetime.js` );
let PersonActivity = require( `${ rootDir }/lib/entities/PersonActivity.js` );
let Person = require( `${ rootDir }/lib/entities/Person.js` );
let People = require( `${ rootDir }/lib/entities/People.js` );


/*
 * -/-/-/-/-/-/-/-/-/-/-/-
 * Get people or a person
 * -/-/-/-/-/-/-/-/-/-/-/-
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( /*/api/v1*/"/people/activities", middleware.allowPreFlightRequest );


	router.get( /*/api/v1*/"/people/activities", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );


		/* ------------------------------------------- \
		 * 1. Get the Client name
		 \-------------------------------------------- */
		let client = req.__client;



		/* ------------------------------------------- \
		 * 2. Extract relevant data from the Request
		 \-------------------------------------------- */
		let date = req.query.date;
		let page_cursor = req.query.page_cursor;
		// If the required data has not been provided
		if ( ! date ) {
			res.status( 400 );
			res.json( {
				code: 400,
				message: "Please provide a date."
			} );
			return;
		}



		/* ----------------------- \
		 * 2. Validate the data
		 \------------------------ */
		if ( typeof date == "string" ) {
			if ( ! [ "yesterday", "today" ].includes( date ) )
				return invalidInputResponse( res, "Please provide a valid date." );
		}

		// Decrypt the page cursor
		let pageCursor;
		if ( page_cursor ) {
			try {
				pageCursor = JSON.parse( Buffer.from( page_cursor, "base64" ).toString( "binary" ) );
			}
			catch ( e ) {
				return invalidInputResponse( res, "The page cursor provided is invalid." );
			}
		}



		/* ----------------------- \
		 * 3. Build the DB query
		 \------------------------ */
		let activities;
		let newPageCursor;
		let projection = {
			// _id: -1,
			when: 1,
			event: 1,
			personId: 1,
			personPhoneNumber: 1,
			"source.medium": 1,
			"source.point": 1,
			"data.agentPhoneNumber": 1,
			"data.recordingURL": 1,
			"data.where": 1
		};

		// Build the date filters
		let currentDateTime = DateTime.utc().setZone( "Asia/Kolkata" );
		let toTheStartOfTheDay = {
			hours: 0,
			minutes: 0,
			seconds: 0,
			milliseconds: 0
		};
		let fromDateTime;
		let toDateTime;

		if ( date == "yesterday" ) {
			fromDateTime = currentDateTime
							.set( toTheStartOfTheDay )
							.minus( { day: 1 } );
			toDateTime = fromDateTime.plus( { day: 1 } );
		}
		else if ( date == "today" ) {
			fromDateTime = currentDateTime.set( toTheStartOfTheDay );
			toDateTime = currentDateTime;
		}
		let criteria = {
			filter: {
				// __schema: 2,
				when: {
					$gte: new Date( fromDateTime.ts ),
					$lt: new Date( toDateTime.ts )
				}
			},
			sort: { when: 1, _id: 1 },
			limit: 15
		};
		if ( pageCursor ) {
			criteria.filter._id = { $gt: ObjectId( pageCursor._id ) };
			criteria.filter.when.$gte = new Date( pageCursor.when );
		}
		try {
			let {
				cursor,
				numberOfRecords,
				pageSize
			} = await PersonActivity.get( criteria, projection );
			activities = await cursor.toArray();
			if ( numberOfRecords > pageSize ) {
				newPageCursor = {
					_id: activities[ activities.length - 1 ]._id,
					when: activities[ activities.length - 1 ].when
				};
			}
		}
		catch ( e ) {
			return noDataFoundResponse( res, `No activities found for ${ date }.` );
		}

		// Re-shape the data
		activities = activities
			.map( function ( activity ) {
				delete activity._id;
				return activity;
			} )



		/* ---------------- \
		 * 4. Respond back
		 \----------------- */
		let responsePayload = {
			code: 200,
			data: activities,
			meta: { paging: { size: activities.length } }
		}
		if ( newPageCursor )
			responsePayload.meta.paging.next_cursor = Buffer.from( JSON.stringify( newPageCursor ), "binary" ).toString( "base64" );
		else
			responsePayload.meta.paging.next_cursor = "";

		res.json( responsePayload );
		res.end();

	} );

	return router;

}



/* ----------------- \
 * Helper functions
 \------------------ */
function invalidInputResponse ( response, message ) {
	response.status( 422 );
	response.json( {
		code: 422,
		message: message
	} );
	response.end();
}

function noDataFoundResponse ( response, message ) {
	response.status( 404 );
	response.json( {
		code: 404,
		message: message
	} );
	response.end();
}
