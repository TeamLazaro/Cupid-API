
// Exports
// module.exports = PersonVerifiedWebhook;





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





class PersonVerifiedWebhook extends Webhook {
	constructor ( clientName, phoneNumber ) {
		super();
		this.event = "person/is/verified";
		if ( clientName )
			this.client = new Client( clientName );
		if ( phoneNumber )
			this.phoneNumber = phoneNumber;
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
				verified: true,
				verificationMethod: "OTP",
				source: {
					medium: "Website",
					point: "Contact section"
				}
			};
		else
			data = {
				when: "2019-10-15T12:24:30.195Z",
				client: "ACME",
				phoneNumber: "+919682355191",
				id: "1509",
				verified: true,
				verificationMethod: "Phone",
				source: {
					medium: "Phone",
					point: "Anshu"
				}
			};

		return data;
	}
}

PersonVerifiedWebhook.prototype.handle = async function handle () {
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
	let person = new Person( this.client.slugName, this.phoneNumber );
	try {
		await person.get();
	}
	catch ( e ) {
		return;
	}
	this.data = {
		when: this._data.when,
		client: person.client,
		phoneNumber: person.phoneNumber,
		id: person.id,
		verified: true,
		verificationMethod: person.verification.method,
		source: person.source
	};

	// Finally, issue the webhook
	return await this.push();
}





// Exports
module.exports = PersonVerifiedWebhook;
