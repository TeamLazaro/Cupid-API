
// Exports
module.exports = function ( options = { } ) {

	let autoRenewAPIKey = options.autoRenewAPIKey || false;

	if ( autoRenewAPIKey ) {
		let scheduler = require( "./scheduler.js" );
		// Schedule the API keys to renew every 45 minutes
		let autoRenewAPIKey__Job = scheduler.schedule( renewAPIKey, 45 * 60 );
		autoRenewAPIKey__Job.start();
		// Renew the API keys right away for good measure
		if ( process.env.NODE_ENV == "production" )
			renewAPIKey();
	}

	return {
		getCustomerByUid
	}

};

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
		"expires_at": expiresOn
	} );

	await fs.writeFile( apiCredentialsFilename, JSON.stringify( apiCredentials, null, "\t" ) );

}





/*
 *
 * A helper function for making an API request to the CRM
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
		httpRequestParameters.headers[ "Content-Type" ] = "application/json";
		httpRequestParameters.data = JSON.stringify( data );
	}

	let response = await axios( httpRequestParameters );

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
		criteriaString = `(${ name }:equals:${ encodeURIComponent( value ) })`;
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
 * Get a customer based on the UID
 *
 */
async function getCustomerByUid ( uid ) {

	let customer;
	try {
		customer = await getRecordWhere( "Contacts", { UID: uid } );
	}
	catch ( e ) {
		return;
	}

	if ( ! customer ) {
		try {
			customer = await getRecordWhere( "Leads", { UID: uid } );
		}
		catch ( e ) {
			return;
		}
	}

	if ( customer ) {
		if ( customer.Stage == "Prospect" )
			customer.isProspect = true;
	}

	return customer;

}
