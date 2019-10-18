
// Exports
// module.exports = GoogleAnalytics;





// Constants
let rootDir = __dirname + "/../../../..";

/*
 *
 * Packages
 *
 */
// Third-party packages
let uuid = require( "uuid/v4" );
let axios = require( "axios" );



class GoogleAnalytics {

	constructor ( api, personId, personDeviceId ) {
		this.httpClient = axios.create( {
			baseURL: "https://www.google-analytics.com/"
		} );
		this._requestBody = {
			v: 1,
			ul: "en-us",
			de: "UTF-8",
			tid: api.trackingId,
		};
		if ( typeof personId == "string" )
			this._requestBody.uid = personId;
		if ( typeof personDeviceId == "string" )
			this._requestBody.cid = personDeviceId;
	}

	get requestBody () {
		return Object.assign( { }, this._requestBody );
		// return this._requestBody;
	}

	set requestBody ( body ) {
		if ( this._requestBody )
			return;
		this._requestBody = body;
	}

	_stringifyBody ( body ) {
		let bodyString = Object.entries( body )
			.map( ( [ k, v ] ) => `${ k }=${ encodeURIComponent( v ) }` )
			.join( "&" )
		return bodyString;
	}

}
// Log conversion
GoogleAnalytics.prototype.logConversion = async function logConversion ( conversionURLFragment, options ) {
	options = options || { };
	let body = this.requestBody;
	body.cid = body.cid || uuid();
	body.ds = options.sourceMedium || "web";
	body.t = "pageview";
	body.dl = `track/${ conversionURLFragment }`
				.replace( /[\s\+\-]+/g, "-" )
				.toLowerCase()

	let response = await this.httpClient.post( "collect", this._stringifyBody( body ) );
	return response;
};
// Log phone calls
GoogleAnalytics.prototype.logPhoneCall = async function logPhoneCall ( call ) {
	let body = this.requestBody;
	body.cid = body.cid || uuid();
	body.ds = "phone";
	body.t = "pageview";
	body.dl = `/phone/${ call.agentName || call.agentPhoneNumber || "missed" }`
				.replace( /[\s\+\-]+/g, "-" )
				.toLowerCase()

	let nowTimestamp = Date.now();

	// 1. Log start of session
	body.qt = nowTimestamp - call.startTime;
	body.sc = "start";
	let responseOne = await this.httpClient.post( "collect", this._stringifyBody( body ) );
	// 2. Log end of session
	body.qt = nowTimestamp - call.endTime;
	body.sc = "end";
	let responseTwo = await this.httpClient.post( "collect", this._stringifyBody( body ) );

	return responseTwo;
};






module.exports = GoogleAnalytics;
