
// Exports
// module.exports = PersonActivity;





// Constants
let rootDir = __dirname + "/../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let dbms = require( `${ rootDir }/lib/dbms.js` );



class PersonActivity {
	constructor ( event ) {

		this.__schema = 1;
		if ( ! event )
			throw new Error( "Please provide an event." );
		this.event = event;
		this.source = { };

	}
	setPersonId ( id ) {
		if ( typeof id == "string" )
			this.personId = id;
		return this;
	}
	setPersonPhoneNumber ( phoneNumber ) {
		if ( typeof phoneNumber == "string" )
			this.personPhoneNumber = phoneNumber;
		return this;
	}
	setClient ( client ) {
		if ( typeof client == "string" )
			this.client = client;
		return this;
	}
	setOccurrence ( date ) {
		if ( date instanceof Date )
			this.when = date;
		return this;
	}
	setSource ( medium ) {
		if ( typeof medium == "string" ) {
			this.source.medium = medium
		}
		return this;
	}
	setServiceProvider ( provider ) {
		this.serviceProvider = provider;
		return this;
	}
	setData ( data ) {
		this.data = data;
		return this;
	}
	/* -----------\
	 * Fluent APIs
	 * --------- */
	associatePerson () {
		return this.setPersonId( ...arguments );
	}
	occurredOn () {
		return this.setOccurrence( ...arguments );
	}
	from () {
		return this.setSource( ...arguments );
	}
}

// Get activities from the database
PersonActivity.get = async function get ( criteria, projection ) {

	// Build the query
	criteria = criteria || { };
	let filter = criteria.filter || { };
	let limit;
	if ( typeof criteria.limit == "number" && ! isNaN( criteria.limit ) )
		limit = criteria.limit;
	else
		limit = 0;

	let sort = criteria.sort || { when: -1 };
	let skip = criteria.skip || 0;

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people-activity" );
	let query = [ filter ];
	if ( typeof projection == "object" )
		query = query.concat( { projection: projection } );

	let cursor = await collection
						.find( ...query )
						.sort( sort )
						.limit( limit )
						.skip( skip );

	let numberOfRecords = await cursor.count( false );
	return {
		cursor: cursor,
		numberOfRecords: numberOfRecords,
		pageSize: limit
	};
}

// Get the most recent activity from the database
PersonActivity.prototype.getMostRecent = async function getMostRecent () {
	let query = {
		filter: {
			event: this.event,
			id: this.personId
		},
		sort: { when: -1 },
		limit: 1
	};
	let { cursor, numberOfRecords } = await this.get( query );
	if ( ! numberOfRecords )
		return { };

	let record = await cursor.next();
	Object.assign( this, record );
	return this;
};

// Add an activity to the database
PersonActivity.prototype.record = async function record () {
	// First, check if this already exists in the database
	if ( this._id )
		return this;

	// Second, check if the required properties have been provided
	for ( let property of [ "event", "client", "personId" ] )
		if ( ! this[ property ] )
			throw new Error( `The property ${ property } was not provided.` );

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people-activity" );

	let recordMeta = { __schema: 1 };
	recordMeta.when = this.when || new Date();
	let record = Object.assign( { }, this, recordMeta );
	let operation = await collection.insertOne( record );
	if ( operation.insertedCount == 1 )
		return this;
	else
		throw new Error( "Could not add the activity record." );
};





module.exports = PersonActivity;
