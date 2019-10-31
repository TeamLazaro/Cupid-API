
// module.exports = WebhookError;

class WebhookError extends Error {
	constructor ( e, address, data ) {
		// Build the error message
		let errorMessage = "";
		if ( e.code )
			errorMessage += e.code;
		if ( e.response )
			errorMessage += e.response.status + " " + e.response.statusText;

		// Call the parent constructor
		super( errorMessage );
		this.name = "WebhookError";

		// Append additional information
		this.moreInformation = { address, data };
	}
}

module.exports = WebhookError;
