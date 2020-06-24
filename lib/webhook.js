
/*
 *
 * This module implements things pertaining to a Webhook
 *
 */

// Exports
// module.exports = Webhook;

/*
 *
 * Constants
 *
 */
let rootDir = __dirname + "/..";

/*
 *
 * Packages
 *
 */
// Third-party packages
let axios = require( "axios" );
// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let dbms = require( `${ rootDir }/lib/dbms.js` );
let WebhookError = require( `${ rootDir }/lib/errors/WebhookError.js` );

let httpClient = axios.create( { timeout: 5000 } );
httpClient.defaults.headers.common[ "User-Agent" ] = "Cupid's Bow";




class Webhook {
	constructor ( event, resource, data ) {
		if ( event )
			this.event = event;
		if ( resource )
			this.resource = resource;
		this.attachData( data );
		this.recipients = [ ];
	}

	getInstance () {
		let eventFileName = this.event.replace( /^\/+|\/+$/g, "" ).replace( /\/+/g, "-" );
		let eventFilePath = `${ rootDir }/lib/webhooks/${ eventFileName }.js`;
		let WebhookEvent = require( eventFilePath );
		let webhookEvent = new WebhookEvent( this.resource, this.data );
		webhookEvent._id = this._id;
		return webhookEvent;
	}

	attachData ( data ) {
		if ( typeof data === "object" )
			this.data = data;
		return this;
	}

	setRecipients ( ...recipients ) {
		recipients = recipients
						// .flat()
						.reduce( function ( acc, el ) {
							acc = acc.concat( el );
							return acc;
						}, [ ] )
						.filter( recipient => recipient )
						.filter( recipient => {
							return typeof recipient.address == "string";
						} );
		this.recipients = recipients;
		return this;
	}
	hasBeenPushed ( status ) {
		if ( ( status !== void 0 ) && ( typeof status === "boolean" ) )
			this._pushed = status;
		return this._pushed;
	}
}

Webhook.prototype.push = async function push () {
	return await this.constructor.push(
		this.event, this.recipients, this.data, this.version
	);
};

Webhook.push = async function push ( event, recipients, data, version ) {

	version = version || 1;
	let payload = {
		_v: version,
		event: event,
		data
	}

	let response;
	for ( let recipient of recipients ) {
		try {
			response = await httpClient.post( recipient.address, payload );
		}
		catch ( e ) {
			// if ( e.code == "ECONNABORTED" )
			// 	return {
			// 		code: 500,
			// 		message: e.message
			// 	};
			// else {
				let error = new WebhookError( e, recipient.address, data );
				await log.toUs( {
					context: `Webhook – ${ event }`,
					message: error.message,
					data: error.moreInformation
				} );
			// }
		}
	}

	return response;

}

Webhook.getByInternalId = async function getByInternalId ( _id, projection ) {

	if ( ! _id )
		throw new Error( "No Id has been provided." );

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "webhook-queue" );

	let query = [ { _id } ];
	if ( projection )
		query = query.concat( { projection: projection } );

	let record = await collection.findOne( ...query );

	if ( ! record )
		throw Error( "No Webhook with the given internal id." );

	// let webhook = new Webhook( record.client, record.event, record.data );
	let webhook = new Webhook();
	webhook = Object.assign( webhook, record );

	return webhook;

}



Webhook.prototype.addToQueue = async function addToQueue () {
	// First, check if this already exists in the database
	if ( this._id )
		return this;

	// Second, check if the required properties have been provided
	for ( let property of [ "resource", "event", "data" ] )
		if ( ! this[ property ] )
			throw new Error( `The property ${ property } was not provided.` );

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "webhook-queue" );

	let recordMeta = { __schema: 1, _pushed: false };
	recordMeta.createdOn = recordMeta.lastModifiedAt = new Date();
	let record = Object.assign( { }, this, recordMeta );
	let operation;
	try {
		operation = await collection.insertOne( record );
	}
	catch ( e ) {
		throw e;
	}
	if ( operation.insertedCount == 1 )
		return this;
	else
		throw new Error( "Could not queue the Webhook." );

}



Webhook.prototype.update = async function update () {
	// First, check if the database id is set
	if ( ! this._id )
		throw new Error( "This webhook is not in the queue." );

	// Update the last modified timestamp
	this.lastModifiedAt = new Date();

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "webhook-queue" );

	let operation = await collection.updateOne( { _id: this._id }, { $set: this } );
	if ( operation.modifiedCount == 1 )
		return this;
	else
		throw new Error( "Could not update the Webhook record." );
	// let operationSummary = { };
	// operationSummary.matchedCount = operation.matchedCount;
	// operationSummary.modifiedCount = operation.modifiedCount;
	// return operationSummary;
};



Webhook.prototype.removeFromQueue = async function removeFromQueue () {

	if ( ! this._id )
		throw new Error( "This webhook is not in the queue." );

	let databaseClient = await dbms.getClient();
	let database = databaseClient.db( "cupid" );
	let collection = database.collection( "webhook-queue" );

	let operation = await collection.deleteOne( { _id: this._id } );

	if ( operation.result.ok !== 1 || operation.result.n === 0 )
		throw new Error( "Unable to remove the webhook from the queue." );

};





// Exports
module.exports = Webhook;
