
// Exports
// module.exports = TwoFactorSMS;





// Constants
let rootDir = __dirname + "/../../../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let axios = require( "axios" );


class TwoFactorSMS {

	constructor ( api ) {
		if ( typeof api.apiKey !== "string" )
			throw new Error( "The API key has not been provided." );
		if ( typeof api.template === "string" )
			this.template = api.template;
		else
			throw new Error( "The OTP message template has not been provided." );

		this.httpClient = axios.create( {
			baseURL: `https://2factor.in/API/V1/${ api.apiKey }/SMS/`
		} );
	}

}

TwoFactorSMS.prototype.sendOTP = async function sendOTP ( phoneNumber ) {
	let response = await this.httpClient.get( `/${ phoneNumber }/AUTOGEN/${ this.template }` );
	return response;
};

TwoFactorSMS.prototype.verifyOTP = async function verifyOTP ( sessionId, otp ) {
	let response = await this.httpClient.get( `/VERIFY/${ sessionId }/${ otp }` );
	return response;
};





module.exports = TwoFactorSMS;
