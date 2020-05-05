
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

		let call = {
			id: log.callid,
			ivrNumber: log.dispnumber
		};

		// The phone number of the caller
		call.phoneNumber = log.caller_id;

		// Was this call taken or missed?
			// Does this field hold a phone number that optionally begins with a `+`?
		if ( /^\+?\d+$/.test( log.destination ) ) {
			call.taken = true;
			call.missed = false;
			call.wasRouted = true;
			// The phone number of the agent who took the call
			call.agentPhoneNumber = log.destination;
		}
		else if ( log.destination.toLowerCase() == "call missed" ) {
			call.taken = false;
			call.missed = true;
		}
		else {
			call.taken = false;
			call.missed = false;
			call.wasRouted = false;
		}

		call.startTime = new Date( log.start_time );
		call.endTime = new Date( log.end_time );

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
