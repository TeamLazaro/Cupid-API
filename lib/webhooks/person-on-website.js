
// Exports
// module.exports = PersonOnWebsiteWebhook;





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





class PersonOnWebsiteWebhook extends Webhook {
	constructor ( clientName ) {
		super();
		this.event = "person/on/website";
		if ( clientName )
			this.client = new Client( clientName );
		this._data = { };
	}

	attachData ( data ) {
		if ( typeof data == "object" )
			this._data = data;
		return this;
	}

	static getMockData () {
		let data;

		if ( Math.round( Math.random() ) )
			data = {
				when: "2019-10-15T12:24:30.195Z",
				client: "ACME",
				phoneNumber: "+919682355191",
				id: "1509",
				name: "Johny Appleseed",
				emailAddresses: [ "jon@apple.com", "jhon@gmail.com" ],
				verified: true,

				where: "Overview Page",
				interests: [ ],
			};
		else
			data = {
				when: "2019-10-15T12:24:30.195Z",
				client: "ACME",
				phoneNumber: "+919682355191",
				id: "1509",
				name: "Johny Appleseed",
				emailAddresses: [ "jon@apple.com", "jhon@gmail.com" ],
				verified: false,

				where: "Pricing Section",
				interests: [ "Product X", "Product Y" ],
			};

		return data;
	}
}

PersonOnWebsiteWebhook.prototype.handle = async function handle () {
	// 0. If neither the client nor the recipients were provided, return
	if ( ! this.client && this.recipients.length === 0 )
		return;

	// 1. Get the recipients
	if ( this.recipients.length === 0 ) {
		try {
			await this.client.get();
		}
		catch ( e ) {
			return;
		}
		let recipients = this.client.getWebhookRecipientsFor( this.event );
		this.setRecipients( recipients );
	}

	// 2. If mock data is to be sent, send it off
	if ( ! this.client ) {
		this.data = this.constructor.getMockData();
		// Issue the webhook
		return await this.push();
	}

	// 3. Gather the data
	this.data = {
		when: new Date,
		client: this._data.client,
		phoneNumber: this._data.phoneNumber,
		id: this._data.id,
		name: this._data.name || "",
		emailAddresses: this._data.emailAddresses || [ ],
		verified: this._data.verification ? this._data.verification.isVerified : false,

		where: this._data.where,
		interests: this._data.interests
	};

	// Finally, issue the webhook
	return await this.push();
}





// Exports
module.exports = PersonOnWebsiteWebhook;
