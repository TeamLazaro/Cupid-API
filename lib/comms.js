
/*
 *
 * This module has functions for exchanging messages
 * 	between our human-communication channels
 *
 */

module.exports = {
	getUserByEmail,
	postMessage
};


// Constants
let rootDir = `${ __dirname }/..`;
let environmentDir = `${ rootDir }/environment`;
let clientsDir = `${ environmentDir }/configuration/clients`;

/*
 *
 * Packages
 *
 */
// Third-party packages
const { WebClient } = require( "@slack/web-api" );
// Our custom imports
let slackConfiguration = require( `${ environmentDir }/configuration/slack.json` );





const slack = new WebClient( slackConfiguration.accessToken );


async function getUserByEmail ( client, emailAddress ) {

	let clientConfiguration = require( `${ clientsDir }/${ client }.json` );
	let slackChannelName = clientConfiguration.channels.salespeople.name;

	let response = await slack.chat.postMessage( {
		channel: slackChannelName,
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: message
				}
			}
		],
		text: message
	} );

	return response;

}


async function postMessage ( client, message ) {

	let clientConfiguration = require( `${ clientsDir }/${ client }.json` );
	let slackChannelName = clientConfiguration.channels.salespeople.name;

	let response = await slack.chat.postMessage( {
		channel: slackChannelName,
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: message
				}
			}
		],
		text: message
	} );

	return response;

}
