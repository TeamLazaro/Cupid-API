
// Exports
// module.exports = GoogleAnalyticsReporting;





// Constants
let rootDir = __dirname + "/../../../..";
const scopes = [ "https://www.googleapis.com/auth/analytics", "https://www.googleapis.com/auth/analytics.readonly" ];

/*
 *
 * Packages
 *
 */
// Third-party packages
let { google } = require( "googleapis" );
let { DateTime, Interval } = require( "luxon" );
// Our custom imports
let { waitFor } = require( `${ rootDir }/lib/utils.js` );





class GoogleAnalyticsReporting {

	constructor ( api ) {
		this.api = api;
		this.viewId = api.viewId;
	}

	// Keeps record of when the last API request was made, used to rate limit requests
	static lastRequestMadeOn

}

GoogleAnalyticsReporting.waitUntilNextTimeSlot = async function waitUntilNextTimeSlot () {

	if ( GoogleAnalyticsReporting.lastRequestMadeOn ) {
		let secondsSinceLastRequest = 0;
		while ( secondsSinceLastRequest < 9 ) {
			secondsSinceLastRequest = Math.round( Interval.fromDateTimes( GoogleAnalyticsReporting.lastRequestMadeOn, DateTime.utc() ).length( "seconds" ) );
			let secondsToWaitFor = 9 - secondsSinceLastRequest;
			if ( secondsToWaitFor > 0 ) {
				// console.log( "gonna wait for " + secondsToWaitFor + " seconds." )
				await waitFor( secondsToWaitFor );
			}
		}
	}

	GoogleAnalyticsReporting.lastRequestMadeOn = DateTime.utc();
	return Promise.resolve()

}

GoogleAnalyticsReporting.prototype.getAPIClient = async function getAPIClient () {
	if ( this.apiClient )
		return this.apiClient;
	this.apiClient = await google.analyticsreporting( {
		version: "v4",
		auth: new google.auth.JWT( this.api.client_email, null, this.api.private_key, scopes )
	} );
	return this.apiClient;
}

GoogleAnalyticsReporting.prototype.getConversionAttribution = async function getConversionAttribution ( id, dateRange ) {
	await GoogleAnalyticsReporting.waitUntilNextTimeSlot();

	/*
	 * ----- Pre-preparation
	 */
	let fromDate;
	let toDate;
	if ( typeof dateRange === "object" && dateRange.from instanceof Date && dateRange.to instanceof Date ) {
		fromDate = DateTime.fromJSDate( dateRange.from ).toUTC().toFormat( "yyyy-MM-dd" );
		toDate = DateTime.fromJSDate( dateRange.to ).toUTC().toFormat( "yyyy-MM-dd" );
	}
	else {
		fromDate = DateTime.utc().minus( { year: 1 } ).toFormat( "yyyy-MM-dd" );
		toDate = DateTime.utc().plus( { day: 1 } ).toFormat( "yyyy-MM-dd" );
	}
	let apiClient = await this.getAPIClient();

	/*
	 * ----- Get the user's sessions
	 */
	let userSessionAPIResponse = await apiClient.userActivity.search( {
		requestBody: {
			viewId: this.viewId,
			user: { type: "CLIENT_ID", userId: id },
			dateRange: {
				startDate: fromDate,
				endDate: toDate
			},
			activityTypes: [ "GOAL" ]
		}
	} );
	let sessions = userSessionAPIResponse.data.sessions;
	if ( ! ( sessions && sessions[ 0 ] && sessions[ 0 ].activities && sessions[ 0 ].activities[ 0 ] ) )
		return null;

	let mostRecentActivity = sessions[ 0 ].activities[ 0 ];

	// Build the filter part of the "report" query
	let filters = [
		"ga:clientId" + "==" + id,
		"ga:adContent" + "!=" + "(not set)",
		// "ga:users" + "==" + 1	// the number of users is inherently going to be 1
	];
	for ( let dimension of [ "campaign", "channelGrouping", "source", "medium", "keyword" ] )
		filters.push( "ga:" + dimension + "==" + mostRecentActivity[ dimension ] );
	filters = filters.join( ";" )



	/*
	 * ----- Get the user's reports
	 */
	let userReportAPIResponse = await apiClient.reports.batchGet( { requestBody: { reportRequests: [ {
		viewId: this.viewId,
		dateRanges: [
			{
				startDate: fromDate,
				endDate: toDate
			}
		],
		// CAREFUL: The order of dimensions specified here is assumed later in the code
		dimensions: [ { name: "ga:clientId" }, { name: "ga:channelGrouping" }, { name: "ga:source" }, { name: "ga:medium" }, { name: "ga:campaign" }, { name: "ga:keyword" }, { name: "ga:adContent" } ],
		metrics: [ { expression: "ga:users" } ],
		filtersExpression: filters
	} ] } } );
	let reports = userReportAPIResponse.data.reports;

	// Extract the `utm_content` value from the report
	let utmContent = "";
	if ( reports && reports[ 0 ] && reports[ 0 ].data && reports[ 0 ].data && reports[ 0 ].data.rows ) {
		for ( let row of reports[ 0 ].data.rows ) {
			if ( row.metrics[ 0 ].values[ 0 ] !== "1" )
				continue;
			// The last element represents the `utm_content`, **because** of the order specified above
			if ( row.dimensions.slice( -1 )[ 0 ].includes( "(not" ) )
				continue;

			utmContent = row.dimensions.slice( -1 )[ 0 ];
			break;
		}
	}


	/*
	 * ----- Build the activity object
	 */
	let activity = {
		when: new Date( mostRecentActivity.activityTime ),
		campaign: mostRecentActivity.campaign.includes( "(not" ) ? "" : mostRecentActivity.campaign,
		channelGrouping: mostRecentActivity.channelGrouping.replace( /[\)\(]/g, "" ),
		source: mostRecentActivity.source.replace( /[\)\(]/g, "" ),
		medium: mostRecentActivity.medium.includes( "(none" ) ? "" : mostRecentActivity.medium,
		keyword: mostRecentActivity.keyword.includes( "(not" ) ? "" : mostRecentActivity.keyword,
		utmContent,
		landingPagePath: mostRecentActivity.landingPagePath
	};

	return activity;
};





module.exports = GoogleAnalyticsReporting;
