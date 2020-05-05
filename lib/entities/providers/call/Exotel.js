
// Exports
// module.exports = ExotelCall;





// Constants
let rootDir = __dirname + "/../../../..";

/*
 *
 * Packages
 *
 */
// Our custom imports
let { DateTime } = require( "luxon" );


class ExotelCall {

	static parse ( log ) {

		// Even when not applicable, it is the string "0"
		log.DialCallDuration = parseInt( log.DialCallDuration, 10 );

		log.CallType = log.CallType.toLowerCase();

		let call = {
			id: log.CallSid,
			ivrNumber: log.To
		};

		// The phone number of the caller
		call.phoneNumber = log.From;

		// Was this call taken or missed?
		if ( log.CallType === "incomplete" ) {
			call.taken = false;
			call.missed = true;
		}
		else if ( log.CallType === "completed" ) {
			call.taken = true;
			call.missed = false;

			call.agentPhoneNumber = log.CallTo;
		}
		else {
			call.taken = false;
			call.missed = false;
		}

		call.startTime = new Date( DateTime.fromISO( log.StartTime.replace( " ", "T" ), { zone: "Asia/Kolkata" } ).ts );
		call.endTime = new Date( call.startTime.getTime() + log.DialCallDuration * 1000 );

		// Call duration
		if ( log.DialCallDuration )
			call.duration = log.DialCallDuration;

		// A link to the recording of the call
		// When unset, it is the string "null"
		if ( typeof log.RecordingUrl === "string" && log.RecordingUrl.length > 9 )
			call.recordingURL = log.RecordingUrl;

		return call;

	}

}





module.exports = ExotelCall;
