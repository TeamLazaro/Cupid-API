
// Exports
// module.exports = PersonPhonedWebhook;





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





class PersonPhonedWebhook extends Webhook {
	constructor ( clientName, phoneNumber ) {
		super();
		this.event = "person/phoned/";
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

				missed: false,
				agent: {
					// name: "Anshu",
					phoneNumber: "+919151115566"
				},
				startTime: "2019-10-15T12:21:48.195Z",
				endTime: "2019-10-15T12:24:27.195Z",
				duration: 159,
				recordingURL: "https://kservices.knowlarity.com/kstorage/read?uuid=9170b90e-1e36-4d13-b736-34033d46ea10_1_r.mp3&server_name=OKHLA&base_dir=recording",
				interests: [ "Product Y" ]
			};
		else
			data = {
				when: "2019-10-15T12:24:30.195Z",
				client: "ACME",
				phoneNumber: "+919682355191",
				id: "1509",
				verified: false,

				missed: true
			};

		return data;
	}
}

PersonPhonedWebhook.prototype.handle = async function handle () {
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
		when: this._data.startTime,
		client: person.client,
		phoneNumber: person.phoneNumber,
		id: person.id,
		verified: person.verification ? person.verification.isVerified : false,

		missed: this._data.missed,
		agent: {
			// name: this._data.agentName,
			phoneNumber: this._data.agentPhoneNumber
		},
		startTime: this._data.startTime,
		endTime: this._data.endTime,
		duration: this._data.duration,
		recordingURL: this._data.recordingURL,
		interests: this._data.interests
	};

	// Finally, issue the webhook
	return await this.push();
}





// Exports
module.exports = PersonPhonedWebhook;
