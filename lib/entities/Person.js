
// Exports
// module.exports = Person;





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



class Person {
	constructor ( client, phoneNumber ) {

		// this.__schema = 3;
		if ( ! client || ! phoneNumber )
			throw new Error( "Please provide the client and person's phone number." );

		this.client = client;
		this.phoneNumber = phoneNumber;

		// this.deviceIds = [ ];
		// this.source = { };
		// this.interests = [ ];
	}
	setSource ( medium, point ) {
		let source = { };
		if ( typeof medium == "string" )
			source.medium = medium;

		if ( typeof point == "string" )
			source.point = point;

		this.source = source;
		return this;
	}
	verifiedWith ( verificationMethod ) {
		if ( typeof verificationMethod == "string" )
			this.verification = { isVerified: true, method: verificationMethod };
		return this;
	}
	unverify () {
		this.verification = { isVerified: false };
		return this;
	}
	addInterests ( ...interests ) {
		// Store a reference to the existing interests
		let existingInterests = this.interests || [ ];

		// Prune out any empty values
		let nonEmptyInterests = interests.filter( interest => interest );

		// Build a list of all the interests
		let allInterests = existingInterests.concat( nonEmptyInterests );

		// Remove any duplicate interests
		let allUniqueInterests = Array.from( new Set( allInterests ) );

		// Finally, assign the interests
		this.interests = allUniqueInterests;

		// MAYBE LATER: Keep only the `n` most recent interests, per product

		return this;
	}
	removeInterests ( ...interests ) {
		if ( ! this.interests )
			return this;

		let interestSet = new Set( this.interests );
		for ( let interest of interests )
			interestSet.delete( interest );

		this.interests = Array.from( interestSet );

		return this;
	}
	hasDeviceIds ( ...ids ) {
		ids = ids.filter( id => id );
		if ( ! ids.length )
			return this;
		this.deviceIds = this.deviceIds || [ ];
		this.deviceIds = Array.from(
			new Set(
				this.deviceIds.concat( ids )
			)
		);
		return this;
	}
	setName ( name ) {
		if ( typeof name == "string" )
			this.name = name;
		return this;
	}
	addEmailAddress ( ...addresses ) {

		addresses = addresses.filter( function ( address ) {
			return typeof address == "string";
		} );
		if ( ! addresses.length )
			return this;

		this.emailAddresses = this.emailAddresses || [ ];

		this.emailAddresses = Array.from(
			new Set(
				this.emailAddresses.concat( addresses )
			)
		);

		return this;
	}
	setId ( id ) {
		this.id = id;
		return this;
	}
	/* -----------\
	 * Fluent APIs
	 * --------- */
	cameFrom () {
		return this.setSource( ...arguments );
	}
	isInterestedIn () {
		return this.addInterests( ...arguments );
	}
	isNoLongerInterestedIn () {
		return this.removeInterests( ...arguments );
	}
	isCalled () {
		return this.setName( ...arguments );
	}
	hasEmailAddress () {
		return this.addEmailAddress( ...arguments );
	}
}

// Get person from the database
Person.prototype.get = async function get ( projection ) {
	// First, check if the required properties have been provided
	for ( let property of [ "client", "phoneNumber" ] )
		if ( ! this[ property ] )
			throw new Error( `The property ${ property } was not provided.` );

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );
	let query = [ {
		client: this.client,
		phoneNumber: this.phoneNumber
	} ];
	if ( projection )
		query = query.concat( { projection: projection } );
	let person = await collection.findOne( ...query );
	if ( ! person )
		throw Error( "No person with the given information found." );
	Object.assign( this, person );
	return this;
}

// Get person from the database ( for the user )
Person.prototype.getForUser = async function getForUser () {
	return ( await this.get( {
		_id: 1,
		id: 1,
		client: 1,
		phoneNumber: 1,
		interests: 1,
		name: 1,
		emailAddresses: 1,
		verification: 1
	} ) );
};

// Add person to the database
Person.prototype.add = async function add () {
	// First, check if this already exists in the database
	if ( this._id )
		return this;

	// Second, check if the required properties have been provided
	for ( let property of [ "client", "phoneNumber" ] )
		if ( ! this[ property ] )
			throw new Error( `The property ${ property } was not provided.` );

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );

	let recordMeta = { __schema: 3 };
	recordMeta.createdOn = recordMeta.lastModifiedAt = new Date();
	let record = Object.assign( { }, this, recordMeta );
	let operation;
	try {
		operation = await collection.insertOne( record );
	}
	catch ( e ) {
		if ( e.code == 11000 ) {
			let error = new Error( "Person with the given client name and phone number already exists." );
			error.code = 51;
			throw error;
		}
		else
			throw e;
	}
	if ( operation.insertedCount == 1 )
		return this;
	else
		throw new Error( "Could not add the Person record." );
	// let operationSummary = Object( { }, operation.result );
	// operationSummary._id = operation.insertedId;
	// operationSummary.insertedCount = operation.insertedCount;
	// return operationSummary;
}

// Update a Person record on the database
Person.prototype.update = async function update () {
	// First, check if the database id is set
	if ( ! this._id )
		await this.get();

	// Update the last modified timestamp
	this.lastModifiedAt = new Date();

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );

	let operation = await collection.updateOne( { _id: this._id }, { $set: this } );
	if ( operation.modifiedCount == 1 )
		return this;
	else
		throw new Error( "Could not update the Person record." );
	// let operationSummary = { };
	// operationSummary.matchedCount = operation.matchedCount;
	// operationSummary.modifiedCount = operation.modifiedCount;
	// return operationSummary;
};
Person.prototype.unset = async function unset ( ...fields ) {

	if ( ! fields.length )
		return;

	let query = Object.fromEntries( fields.map( field => [ field, "" ] ) );

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );

	let operation = await collection.updateOne( { _id: this._id }, { $unset: query } );

	return operation;

};






module.exports = Person;
