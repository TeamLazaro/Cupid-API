
// Exports
// module.exports = KnowlarityCall;





// Constants
let rootDir = __dirname + "/../../../..";

/*
 *
 * Packages
 *
 */
// Our custom imports


class KnowlarityCall {

	static parse ( log ) {

		let call = { };

		// The phone number of the caller
		call.phoneNumber = log.caller_id;

		// Was this call taken or missed?
		if ( log.destination.toLowerCase() == "call missed" ) {
			call.taken = false;
			call.missed = true;
		}
		else {
			call.taken = true;
			call.missed = false;
			// The phone number of the agent who took the call
			call.agentPhoneNumber = log.destination;
		}

		// Call duration
		if ( log.call_duration )
			call.duration = parseInt( log.call_duration, 10 );

		// A link to the recording of the call
		if ( log.resource_url )
			call.recordingURL = log.resource_url;

		return call;

	}

}





module.exports = KnowlarityCall;
