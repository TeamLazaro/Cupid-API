
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

	getWebhookRecipientsFor ( event ) {
		let recipients;

		if ( ! this.webhooks )
			recipients = [ ];
		else if (
			Array.isArray( this.webhooks[ event ] )
			&& ( typeof this.webhooks[ event ][ 0 ] == "object" )
			&& this.webhooks[ event ][ 0 ].address
		)
			recipients = this.webhooks[ event ];
		else if (
			Array.isArray( this.webhooks[ "*" ] )
			&& ( typeof this.webhooks[ "*" ][ 0 ] == "object" )
			&& this.webhooks[ "*" ][ 0 ].address
		)
			recipients = this.webhooks[ "*" ];
		else
			recipients = [ ];

		return recipients;
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
	let collection = database.collection( "clients" );

	let operation = await collection.updateOne( { _id: this._id }, {
		$set: { lastModifiedAt: this.lastModifiedAt },
		$inc: { lastPersonId: 1 }
	} );
	if ( operation.modifiedCount == 1 ) {
		await this.get();
		return this.lastPersonId;
	}
	else
		throw new Error( "Could not update the Client record." );
};





module.exports = Client;
