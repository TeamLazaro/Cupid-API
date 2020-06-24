
// Exports
module.exports = {
	successResponse,
	notFoundResponse,
	invalidInputResponse,
	serverErrorResponse
}





function respond ( response, statusCode, message, data ) {
	let body = {
		code: statusCode,
		message: message
	}
	if ( typeof data === "object" )
		body.data = data;

	response.status( statusCode );
	response.json( body );
	response.end();
}

function successResponse ( response, message, data ) {
	return respond( response, 200, message, data );
}

function notFoundResponse ( response, message, data ) {
	return respond( response, 404, message, data );
}

function invalidInputResponse ( response, message, data ) {
	return respond( response, 422, message, data );
}

function serverErrorResponse ( response, message, data ) {
	return respond( response, 500, message, data );
}
