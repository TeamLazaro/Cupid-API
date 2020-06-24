
// Exports
// module.exports = PersonMadePurchaseWebhook;





// Constants
let rootDir = __dirname + "/../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let Webhook = require( `${ rootDir }/lib/webhook.js` );
let Client = require( `${ rootDir }/lib/entities/Client.js` );
let Person = require( `${ rootDir }/lib/entities/Person.js` );





class PersonMadePurchaseWebhook extends Webhook {
	constructor ( resource, data ) {
		super( "person/made/purchase", resource, data );
		this.personInternalId = resource._id;
		this.clientName = resource.clientName;
		// this.client = new Client( resource.clientName );
	}
}

PersonMadePurchaseWebhook.prototype.handle = async function handle () {

	// Get the Client and the Person
	let person;
	let client = new Client( this.clientName );
	try {
		await client.get();
		person = await Person.getByInternalId( this.personInternalId, this.clientName );
	}
	catch ( e ) {
		return;
	}

	if ( ! person.id )
		throw new Error( "The Person does not have an Id yet." );

	// Fetch the recipients
	let recipients = client.getWebhookRecipientsFor( this.event );
	this.setRecipients( recipients );

	// Assemble the data
	let payload = {
		when: this.data.when,
		client: this.clientName,
		personId: person.id,
		phoneNumber: person.phoneNumber,
		verified: person.verification ? person.verification.isVerified : false,

		description: this.data.description,
		amount: this.data.amount,
		provider: this.data.provider
	};

	let transactionDetails = { ...this.data };
	delete transactionDetails.when;
	delete transactionDetails.description;
	delete transactionDetails.amount;
	delete transactionDetails.provider;
	payload.transactionDetails = transactionDetails;

	this.data = payload;

	// Finally, issue the webhook
	return await this.push();

}





// Exports
module.exports = PersonMadePurchaseWebhook;
