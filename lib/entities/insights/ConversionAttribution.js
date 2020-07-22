
// Exports
// module.exports = ConversionAttribution;





// Constants
let rootDir = __dirname + "/../../..";

/*
 *
 * Packages
 *
 */
let { DateTime } = require( "luxon" );
// Our custom imports
let Insight = require( `${ rootDir }/lib/entities/insights/Insight.js` );
let Client = require( `${ rootDir }/lib/entities/Client.js` );
let GoogleAnalyticsReporting = require( `${ rootDir }/lib/entities/providers/analytics-reporting/GoogleAnalytics.js` );



class ConversionAttribution extends Insight {

	static getCriteria () {
		let toDate = DateTime.utc().minus( { hours: 2 } );
		let fromDate = toDate.minus( { hours: 72 } );

		let filter = {
			id: { $ne: "-1" },
			createdOn: {
				$gte: new Date( fromDate.ts ),
				$lt: new Date( toDate.ts )
			},
			"insights.conversionAttribution.hasBeenGathered": { $ne: true }
		};

		return { filter };
	}

}



ConversionAttribution.gather = async function gather ( person ) {
	let analyticsIds = person.getGoogleAnalyticsIds();
	if ( ! analyticsIds.length )
		return null;

	let client = new Client( person.client );
	await client.get();
	let api = client.providers.analyticsReporting.find( provider => provider.name === "Google Analytics" ).api;

	let reporter = new GoogleAnalyticsReporting( api );
	let analyticsId = analyticsIds[ 0 ];
	let toDate = DateTime.fromJSDate( person.createdOn ).toUTC().plus( { day: 1 } );
	let fromDate = toDate.minus( { year: 1 } );
	let dateRange = {
		from: new Date( fromDate.ts ),
		to: new Date( toDate.ts )
	};

	let activity = await reporter.getConversionAttribution( analyticsId, dateRange );

	return activity;
}


ConversionAttribution.store = async function store ( data, person ) {
	return await ConversionAttribution.__proto__.store( "conversionAttribution", data, person );
}





module.exports = ConversionAttribution;
