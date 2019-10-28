
// Exports
// module.exports = Client;





// Constants
let rootDir = __dirname + "/../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let dbms = require( `${ rootDir }/lib/dbms.js` );



class Client {
	constructor ( name ) {

		// if ( ! name )
		// 	throw new Error( "Please provide the client's (slug) name." );

		if ( name != name.toLowerCase() )
			this.name = name;
		else
			this.slugName = name;

	}
}

// Get client from the database
Client.prototype.get = async function get ( projection ) {
	// First, check if the required properties have been provided
	if ( ! this.name && ! this.slugName )
		throw new Error( `Neither the name or slug name has been provided.` );

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "clients" );
	let query = [ {
		$or: [
			{ slugName: this.slugName || "" },
			{ name: this.name || "" }
		]
	} ];
	if ( projection )
		query = query.concat( { projection: projection } );
	let client = await collection.findOne( ...query );
	if ( ! client )
		throw Error( "No client with the given information found." );
	Object.assign( this, client );
	return this;
}

// Get a unique id to use for a Person
Client.prototype.getIdForPerson = async function getIdForPerson () {
	// First, check if the database id is set
	if ( ! this._id )
		await this.get();

	// Update the last modified timestamp
	this.lastModifiedAt = new Date();

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "people" );

	let operation = await collection.replaceOne( { _id: this._id }, this );
	if ( operation.modifiedCount == 1 )
		return this;
	else
		throw new Error( "Could not update the Person record." );
	// let operationSummary = { };
	// operationSummary.matchedCount = operation.matchedCount;
	// operationSummary.modifiedCount = operation.modifiedCount;
	// return operationSummary;
};






module.exports = Client;