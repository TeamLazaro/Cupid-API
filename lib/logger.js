
/*
 *
 * This module has functions for logging
 *
 */

module.exports = {
	toConsole,
	toUs,
	logToUs
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
let util = require( "util" );
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

	for ( let thing of things )
		if ( typeof thing !== "object" )
			console.log( thing );
		else
			console.log( util.inspect( thing, { colors: false, depth: null } ) );

}

/*
 * Log to us
 */
// Alias to the `toUs` function
async function logToUs ( ...args ) {
	return toUs( ...args );
}
async function toUs ( blackbox ) {

	if ( process.env.NODE_ENV == "production" )
		return;
	let timestampString = datetime.getTimestamp( "g:i a\td/m/Y", { timezone: "IST" } );

	let environmentName = environment.name;
	// let context = blackbox.context || arguments.callee.caller.name || "Unknown";
	let context = blackbox.context || "Unknown";
	let message = blackbox.message || "No message provided.";
	let data = blackbox.data || null;
	// let callStack = arguments.callee.caller.name;

	let blocks = [
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
		}
	];

	if ( data ) {
		let stringifiedData = JSON.stringify( data, null, "\t" );
		if ( stringifiedData.length < 9 && data instanceof Error )
			stringifiedData = data.stack;

		blocks.push( {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "```\n" + stringifiedData + "\n```"
			}
		} );
	}
	blocks.push( { "type": "divider" } );

	await slack.chat.postMessage( {
		channel: configuration.slack.channelId,
		blocks: blocks,
		// the below version is used for notifications
		text: `${ context } — ${ environmentName }\n${ message }`
	} );

}
