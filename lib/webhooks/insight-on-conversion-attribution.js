
// Exports
// module.exports = InsightOnConversionAttribution;





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





class InsightOnConversionAttribution extends Webhook {
	constructor ( resource, data ) {
		super( "insight/on/conversion-attribution", resource, data );
		this.personInternalId = resource._id;
		this.clientName = resource.clientName;
		// this.client = new Client( resource.clientName );
	}
}

InsightOnConversionAttribution.simulate = async function simulate ( recipients, data ) {

	let webhookEvent = new InsightOnConversionAttribution( { clientName: "XYZ", _id: 1991 } );
	webhookEvent.setRecipients( recipients );
	webhookEvent.attachData( data || { } );

	if ( ! webhookEvent.data.client ) {
		let randomNumber = Math.round( Math.random() * 10 );
		if ( randomNumber < 4 )
			webhookEvent.attachData( {
				client: "ACME",
				phoneNumber: "+919991111196",
				id: "1127",

				when: "2019-01-19T10:01:51.000Z",
				campaign: "Summer Sale | Product A | Feature Y",
				channelGrouping: "Display",
				source: "google",
				medium: "cpc",
				keyword: "USD75Kto100K",
				utmContent: "",
				landingPagePath: "acme.com/product-a/feature-y"
			} );
		else if ( randomNumber < 7 )
			webhookEvent.attachData( {
				client: "ACNE",
				phoneNumber: "+919666655999",
				id: "1509",

				when: "2019-10-19T05:02:51.070Z",
				campaign: "",
				channelGrouping: "Referral",
				source: "productb.com",
				medium: "referral",
				keyword: "",
				utmContent: "Product-B-Deep-Dive",
				landingPagePath: "acne.com/product-b"
			} );
		else
			webhookEvent.attachData( {
				client: "ACNO",
				phoneNumber: "+919611655991",
				id: "1455",

				when: "2019-06-07T13:05:41.505Z",
				campaign: "",
				channelGrouping: "Organic Search",
				source: "google",
				medium: "organic",
				keyword: "",
				utmContent: "Product-B-Feature-Y",
				landingPagePath: "acno.com/product-b"
			} );
	}

	// Finally, issue the webhook
	return await webhookEvent.push();

}

InsightOnConversionAttribution.prototype.handle = async function handle () {

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
		id: person.id,
		phoneNumber: person.phoneNumber,

		campaign: this.data.campaign,
		channelGrouping: this.data.channelGrouping,
		source: this.data.source,
		medium: this.data.medium,
		keyword: this.data.keyword,
		utmContent: this.data.utmContent,
		landingPagePath: this.data.landingPagePath
	};

	this.data = payload;

	// Finally, issue the webhook
	return await this.push();

}





// Exports
module.exports = InsightOnConversionAttribution;
