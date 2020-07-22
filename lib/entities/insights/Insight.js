
// Exports
// module.exports = Insight;





// Constants
let rootDir = __dirname + "/../../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let dbms = require( `${ rootDir }/lib/dbms.js` );



class Insight {
}

/*
 *
 * 1. Create the "insight" record if it don't exist
 * 2. Append to / or update in-place, if the "insight" record already exists
 *
 * Fields to store:
 * A. Name of insight. ex. `conversionAttribution`
 * B. hasBeenGathered
 * C. lastGatheredOn
 *
 *
 */
Insight.store = async function store ( name, data, person ) {

	person.recordInsight( name, !! data );

	// Stub out the insight data if there's nothing
	data = data || { };

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people-insights" );

	// If the Insight record for this Person already exists
	if ( person.getInsightRecord() ) {
		await collection.updateOne(
			{ _id: person.getInsightRecord() },
			{ $set: { [ name ]: data } }
		);
	}
	else {
		let operation = await collection.insertOne( {
			personId: person.getId(),
			[ name ]: data
		} );
		person.setInsightRecord( operation.insertedId );
	}

	// Finally, update the person
	await person.update();

}





module.exports = Insight;
