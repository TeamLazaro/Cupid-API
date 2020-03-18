
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let logger = require( `${ rootDir }/lib/logger.js` );
let { notFoundResponse } = require( `${ rootDir }/lib/http.js` );
let Client = require( `${ rootDir }/lib/entities/Client.js` );
let OTP = require( `${ rootDir }/lib/entities/providers/otp/OTP.js` );


/*
 * -/-/-/-/-/
 * Send an OTP to a Person
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	// First, allow pre-flight requests
	router.options( "/v2/people/otp/send", middleware.allowPreFlightRequest );


	router.post( "/v2/people/otp/send", async function ( req, res ) {

		// res.header( "Access-Control-Allow-Origin", "*" );
		res.header( "Access-Control-Allow-Origin", req.headers.origin );
		res.header( "Access-Control-Allow-Credentials", "true" );

		// Pull the data from the request
		let clientName = req.body.client;
		let phoneNumber = req.body.phoneNumber;


		/* ----------------------- \
		 * 2. Validate the data
		 \------------------------ */
		if ( typeof clientName !== "string" || ! clientName.trim() )
			return invalidInputResponse( res, "Please provide a client name." );
		if ( typeof phoneNumber !== "string" || ! phoneNumber.trim() )
			return invalidInputResponse( res, "Please provide a phone number." );



		// Get the Client
		let client = new Client( clientName );
		try {
			await client.get();
		}
		catch ( e ) {
			notFoundResponse( res, "The client with the provided name was not found." );
			await logger.logToUs( {
				context: "Endpoint: /v2/people/otp/send",
				message: "Sending OTP to Person >> " + e.message
			} );
			return;
		}

		// The Person is not being checked for existence because depending on the client's policy, a Person record will only be created after verification.

		// Get the OTP service
		let otpProvider = client.providers.otp[ 0 ];
		let OTPService = OTP.getService( otpProvider.name );
		let otpService = new OTPService( otpProvider );

		// Now, send the OTP
		let response;
		try {
			response = await otpService.sendOTP( phoneNumber );
			if ( ! response.data )
				throw new Error( "The response object has no data field." );
		}
		catch ( e ) {
			if ( e.isAxiosError && e.response && typeof e.response.data == "object" ) {
				res.json( e.response.data );
				res.end();
				return;
			}
			serverErrorResponse( res, "Something wen't wrong." );
			await logger.toUs( {
				context: "Endpoint: /v2/people/otp/send",
				message: "Sending OTP to Person >> " + e.message,
				data: e
			} );
			return;
		}

		res.json( response.data );
		res.end();

	} );

	return router;

}
