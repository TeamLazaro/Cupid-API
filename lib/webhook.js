
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
let WebhookError = require( `${ rootDir }/lib/errors/WebhookError.js` );

let httpClient = axios.create( { timeout: 5000 } );
httpClient.defaults.headers.common[ "User-Agent" ] = "Cupid's Bow";




class Webhook {
	constructor () {
		this.recipients = [ ];
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
			if ( e.code == "ECONNABORTED" )
				return {
					code: 500,
					message: e.message
				};
			else {
				let error = new WebhookError( e, recipient.address, data );
				await log.toUs( {
					context: `Webhook – ${ event }`,
					message: error.message,
					data: error.moreInformation
				} );
			}
		}
	}

	return response;

}





// Exports
module.exports = Webhook;
