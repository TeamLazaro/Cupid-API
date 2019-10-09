
/*
 *
 * This module has functions for logging
 *
 */

module.exports = {
	toConsole,
	toUs
};

// Constants
let rootDir = __dirname + "/../";
let environmentFilename = rootDir + "environment/configuration/environment.json";
let configurationFilename = rootDir + "environment/configuration/logging.json";
/*
 *
 * Packages
 *
 */
// Third-party packages
const { WebClient } = require( "@slack/web-api" );
// Our custom imports
let datetime = require( `${ rootDir }/lib/datetime.js` );
let environment = require( environmentFilename );
let configuration = require( configurationFilename );





const slack = new WebClient( configuration.slack.accessToken );





function toConsole ( ...things ) {

	if ( process.env.NODE_ENV == "production" )
		return;

	console.log( ...things );

}

/*
 * Log to us
 */
async function toUs ( blackbox ) {

	if ( process.env.NODE_ENV == "production" )
		return;
	let timestampString = datetime.getTimestamp( "g:i a\td/m/Y", { timezone: "IST" } );

	let environmentName = environment.name;
	let context = blackbox.context || arguments.callee.caller.name || "Unknown";
	let message = blackbox.message || "No message provided.";

	await slack.chat.postMessage( {
		channel: configuration.slack.channelId,
		blocks: [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `\n_${ timestampString }_\n*${ environmentName }*`
				}
			},
			{ "type": "divider" },
			{
				"type": "context",
				"elements": [
					{
						"type": "mrkdwn",
						"text": `_${ context }_`
					}
				]
			},
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": message
				}
			},
			{ "type": "divider" }
		],
		// the below version is used for notifications
		text: `${ context } – ${ environmentName }\n${ message }`
	} );

}
