
// Exports
// module.exports = Log;





// Constants
let rootDir = __dirname + "/../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let dbms = require( `${ rootDir }/lib/dbms.js` );



class Log {
	constructor ( type, data ) {

		if ( ! type )
			throw new Error( "Please provide a log type." );

		this.type = type.toLowerCase();
		this.data = data || { };
		this.expireInSeconds = 14 * 24 * 60 * 60 * 1000;

	}

	setData ( data ) {
		this.data = data;
		return this;
	}
	purgeInSeconds ( seconds ) {
		this.expireInSeconds = seconds;
		return this;
	}
}


// Add log to the database
Log.prototype.add = async function add () {

	if ( ! this.data )
		return this;

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collectionName = `logs--${ this.type }`;
	let collection = database.collection( collectionName );

	let recordMeta = { __schema: 1 };
	recordMeta.__createdOn = new Date();
	// Expire the record "two weeks from now" ( by default )
	recordMeta.__expireAt = new Date( Date.now() + this.expireInSeconds );
	let record = Object.assign( { }, this.data, recordMeta );
	let operation = await collection.insertOne( record );
	if ( operation.insertedCount == 1 )
		return this;
	else
		throw new Error( "Could not add the Log record." );
}





module.exports = Log;
