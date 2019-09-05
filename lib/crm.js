
// Exports
module.exports = {
	getCustomerByInternalId,
	getCustomerByExternalId,
	getCustomerByPhoneNumbers,
	addCustomer,
	updateCustomerByInternalId,
	getOtherInformationAsString,
	getSalespersonById
};


// Schedule the API keys to renew every 45 minutes
let scheduler = require( "./scheduler.js" );
let autoRenewAPIKey__Job = scheduler.schedule( renewAPIKey, 45 * 60 );
autoRenewAPIKey__Job.start();
// Renew the API keys right away for good measure
if ( process.env.NODE_ENV == "production" )
	renewAPIKey();



// Constants
let rootDir = __dirname + "/../";
let apiCredentialsFilename = rootDir + "environment/configuration/zoho.json";

/*
 *
 * Packages
 *
 */
// Standard libraries
let fs = require( "fs" ).promises;
// Third-party packages
let qs = require( "qs" );
let axios = require( "axios" );
// Our custom imports
let apiCredentials = require( apiCredentialsFilename );
let utils = require( "./utils.js" );





/*
 *
 * Renew the API keys
 *
 */
async function renewAPIKey () {

	let response;

	try {
		let queryParameters = qs.stringify( {
			client_id: apiCredentials.client_id,
			client_secret: apiCredentials.client_secret,
			refresh_token: apiCredentials.refresh_token,
			grant_type: "refresh_token"
		} );
		response = await axios.post( `https://accounts.zoho.com/oauth/v2/token?${ queryParameters }` );
	}
	catch ( e ) {
		return;
	}

	let freshAPICredentials = response.data;
	let accessToken = freshAPICredentials.access_token;
	let expiresOn = Math.round(
		( Date.now() / 1000 )
		+ ( freshAPICredentials.expires_in / 1000 )
		- ( 5 * 60 )
	);

	apiCredentials = Object.assign( apiCredentials, {
		"access_token": accessToken,
		"expires_at": expiresOn,
		"lastRefreshedOn": ( new Date ).toString()
	} );

	await fs.writeFile( apiCredentialsFilename, JSON.stringify( apiCredentials, null, "\t" ) );

}





/*
 *
 * A helper function for making an API request to the CRM
 * TODO: Take into account the client so as to map to the CRM instance
 *
 */
async function makeAPIRequest ( endpoint, data, method ) {

	let httpRequestParameters = {
		headers: {
			"Authorization": `Zoho-oauthtoken ${ apiCredentials.access_token }`,
			"Cache-Control": "no-cache, no-store, must-revalidate"
		},
		url: `https://www.zohoapis.com/crm/v2/${ endpoint }`,
		method: method || "GET",
	};
	if ( data ) {
		if ( method == "POST" || method == "PUT" ) {
			httpRequestParameters.headers[ "Content-Type" ] = "application/json";
			httpRequestParameters.data = JSON.stringify( data );
		}
		else
			httpRequestParameters.params = data;
	}

	let response;
	try {
		response = await axios( httpRequestParameters );
	}
	catch ( e ) {
		if ( e.isAxiosError && e.response.status == 401 )
			throw new Error( "Zoho API key is either invalid or has expired." );
		throw e;
	}

	return response.data;

}



/*
 * -----
 * Criterion stringifier
 * -----
 */
function getStringifiedCriterion ( name, relation__value ) {

	let criteriaString = "";

	if ( Array.isArray( relation__value ) ) {
		let [ operator, value ] = relation__value;
		let operatorsToWords = {
			"=": "equals",
			"^=": "starts_with"
		};
		criteriaString = `(${ name }:${ operatorsToWords[ operator ] }:${ encodeURIComponent( value ) })`;
	}
	else if ( relation__value !== undefined || relation__value !== null ) {
		let value = relation__value;
		// If the value has spaces, url-encode it, else don't
			// This is just a heuristic, not a comprehensive solution
				// We don't want to encode the '+' in phone numbers, is why
		if ( /\s/.test( value ) )
			criteriaString = `(${ name }:equals:${ encodeURIComponent( value ) })`;
		else
			criteriaString = `(${ name }:equals:${ value })`;
	}

	return criteriaString;

}
/*
 * -----
 * Criteria resolver
 * -----
 */
function getResolvedCriteria ( criteria ) {

	let name = Object.keys( criteria )[ 0 ];

	if ( [ "or", "and" ].includes( name ) ) {
		let operator = name;
		let subCriteria = criteria[ operator ];
		let subCriteriaStrings = Object.keys( subCriteria ).map( function ( name ) {
			return getResolvedCriteria( { [ name ]: subCriteria[ name ] } );
		} );
		return `(${ subCriteriaStrings.join( operator ) })`;
	}
	else {
		return getStringifiedCriterion(
			Object.keys( criteria )[ 0 ],
			Object.values( criteria )[ 0 ]
		);
	}

}



/*
 *
 * A helper function for getting records that meet given conditions
 *
 */
async function getRecordWhere ( recordType, criteria = { } ) {

	let endpoint = `${ recordType }/search?criteria=(${ getResolvedCriteria( criteria ) })`;

	let response = await makeAPIRequest( endpoint );

	if ( ! response.data )
		return null;

	let record = response.data[ 0 ];
	record.recordType = recordType;

	return record;

}

/*
 *
 * Get a customer based on the CRM's public (external) id for the record
 *
 */
async function getCustomerByExternalId ( uid ) {

	let customer;
	customer = await getRecordWhere( "Contacts", { UID: uid } );

	if ( ! customer )
		customer = await getRecordWhere( "Leads", { UID: uid } );

	if ( ! customer )
		return false;

	if ( customer.Stage == "Prospect" )
		customer.isProspect = true;

	return customer;

}

/*
 *
 * Get a customer based on the internal id used by the CRM for the record
 *
 */
async function getCustomerByInternalId ( client, id ) {

	let response;
	response = await makeAPIRequest( `Contacts/${ id }` );

	if ( ! response.data )
		response = await makeAPIRequest( `Leads/${ id }` );

	if ( ! response.data )
		return false;

	let customer = response.data[ 0 ];

	if ( customer.Stage == "Prospect" )
		customer.isProspect = true;

	return customer;

}

/*
 *
 * Get a customer based on the given phone number
 *
 */
async function getCustomerByPhoneNumbers ( client, phoneNumbers ) {

	let customer;

	customer = await getRecordWhere( "Contacts", {
		and: {
			Is_Duplicate: false,
			Project: [ "^=", client ],
			or: {
				Phone: phoneNumbers[ 0 ],
				Other_Phone: phoneNumbers[ 0 ],
				Mobile: phoneNumbers[ 0 ],
				Home_Phone: phoneNumbers[ 0 ],
				Asst_Phone: phoneNumbers[ 0 ]
			}
		}
	} );

	if ( ! customer ) {
		customer = await getRecordWhere( "Leads", {
			and: {
				Is_Duplicate: false,
				Project: [ "^=", client ],
				or: {
					Phone: phoneNumbers[ 0 ],
					Alt_Mobile: phoneNumbers[ 0 ],
				}
			}
		} );
	}

	if ( customer ) {
		if ( customer.Stage == "Prospect" )
			customer.isProspect = true;
		customer.internalId = customer.id.trim();
		customer.externalId = ( customer.UID || customer.Hidden_UID ).trim();
	}

	return customer || false;

}

/*
 *
 * Add a customer based on the given data
 *
 */
async function addCustomer ( person ) {

	let endpoint = "Contacts";

	// Now, prepare the request body
	let requestBody = {
		data: [
			{
				Stage: "Lead",
				Project: [ person.interest ],	// because it's a list data type
				Phone: person.phoneNumber,
				Email: person.emailAddress || "",
				First_Name: person.name || "AG",
				Last_Name: "[ unverified ]",
				Lead_Source: "Website",
				Customer_Status: "Fresh",
				Mobile: ( person.contact && person.contact.otherPhoneNumbers[ 0 ] ) || "",
				Home_Phone: ( person.contact && person.contact.otherPhoneNumbers[ 1 ] ) || "",
				Asst_Phone: ( person.contact && person.contact.otherPhoneNumbers[ 2 ] ) || "",
				Other_Phone: ( person.contact && person.contact.otherPhoneNumbers[ 3 ] ) || "",
				Secondary_Email: ( person.contact && person.contact.otherEmailAddresses[ 0 ] ) || ""
			}
		],
		// Let's not trigger any workflow rules because we don't want a feedback loop
		trigger: [ ]
	};


	let response;
	response = await makeAPIRequest( endpoint, requestBody, "POST" );

	let responseBody = response.data[ 0 ];

	let internalId = responseBody[ 'details' ][ 'id' ];

	// Now, get the UID of the newly created customer
		// wait for a bit, so that the CRM can digest on the new record
	await utils.waitFor( 9 );
	let customer = await getCustomerByInternalId( person.client, internalId );

	if ( ! customer )
		return false;

	let externalId = customer[ "Hidden_UID" ] && customer[ "Hidden_UID" ].trim();

	return {
		internalId,
		externalId
	};

}



/*
 *
 * Update a customer record that matches the given data
 *
 */
async function updateCustomerByInternalId ( client, id, data ) {

	let endpoint = `Contacts/${ id }`;

	let requestBody = {
		data: [ data ],
		trigger: [
			"approval",
			"workflow",
			"blueprint"
		]
	};

	let response = await makeAPIRequest( endpoint, requestBody, "PUT" );
	let responseBody = response.data[ 0 ];

	if ( responseBody.code.toLowerCase() != "success" )
		throw new Error( "Update operation of record to the CRM failed." );

	return {
		internalId: responseBody.details.id
	};

}



/*
 *
 * Return a string containing information
 * 	for which they are not dedicated fields.
 *
 */
function getOtherInformationAsString ( person ) {

	// Assemble all the remaining information that don't fit into dedicated fields
	let otherInformation = "";
	if ( person.career )
		otherInformation += `Career:\n- ${ person.career.join( "\n- " ) }`;
	if ( person.education )
		otherInformation += `\n\nEducation:\n- ${ person.education.join( "\n- " ) }`;
	if ( person.onTheInteret ) {
		let linkedIn__Data = person.onTheInteret.find( function ( place ) {
			return place.name.toLowerCase() == "linkedin";
		} )
		if ( linkedIn__Data )
			linkedIn__Data += `\n\nLinkedIn: ${ linkedIn__Data.url }`;
	}

	otherInformation = otherInformation.trim();
	if ( otherInformation )
		otherInformation = `-/-/-/-/-/-/-/-\n\n${ otherInformation }\n\n-/-/-/-/-/-/-/-`;

	return otherInformation;

}



/*
 *
 * Return a salesperson, given an id
 *
 */
async function getSalespersonById ( client, id ) {

	let response = await makeAPIRequest( `users/${ id }` );

	if ( ! response.users )
		return false;

	let salesperson = response.users[ 0 ];

	return salesperson;

}
