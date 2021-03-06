
// Exports
// module.exports = People;





// Constants
let rootDir = __dirname + "/../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let dbms = require( `${ rootDir }/lib/dbms.js` );
let Person = require( `${ rootDir }/lib/entities/Person.js` );



class People {

}

// Get people from the database
People.getRaw = async function getRaw ( criteria, projection ) {

	// Build the query
	criteria = criteria || { };
	let filter = criteria.filter || { };
	let limit;
	if ( typeof criteria.limit == "number" && ! isNaN( criteria.limit ) )
		limit = criteria.limit;
	else
		limit = 0;

	let sort = criteria.sort || { createdOn: -1 };
	let skip = criteria.skip || 0;

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );
	let query = [ filter ];
	if ( typeof projection == "object" )
		query = query.concat( { projection: projection } );

	let peopleCursor = await collection
						.find( ...query )
						.sort( sort )
						.limit( limit )
						.skip( skip );

	let numberOfPeople = await peopleCursor.count( false );
	return {
		cursor: peopleCursor,
		numberOfRecords: numberOfPeople,
		pageSize: limit
	};
}


People.get = async function get ( criteria, projection ) {

	let {
		cursor,
		numberOfRecords,
		pageSize
	} = await People.getRaw( criteria, projection );

	let people = [ ];
	while ( await cursor.hasNext() ) {
		let record = await cursor.next();
		let person = new Person( record.client, record.phoneNumber );
		person = Object.assign( person, record );
		people.push( person );
	}

	return people;

}





module.exports = People;
