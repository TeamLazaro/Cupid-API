
/*
 *
 * This module has functions relating to phone numbers
 *
 */

module.exports = {
	isPhoneNumberValid
};

// Constants
let rootDir = __dirname + "/../";
let configurationFilename = rootDir + "environment/configuration/numverify.json";

/*
 *
 * Packages
 *
 */
// Third-party packages
let qs = require( "qs" );
let axios = require( "axios" );
// Our custom imports
let configuration = require( configurationFilename );





async function isPhoneNumberValid ( phoneNumber ) {

	let response;
	response = await axios.get( configuration.endpoint, { params: {
		access_key: configuration.accessKey,
		number: phoneNumber
	} } );

	return response.data;

}
