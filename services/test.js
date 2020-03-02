#! /usr/bin/node
/*
 *
 * This is a test.
 *
 */

// Constants
let rootDir = __dirname + "/..";
let slack__ConfigurationFilename = rootDir + "/environment/configuration/slack.json";

// Third-party packages
const { WebClient } = require( "@slack/web-api" );

// Our custom imports
let log = require( `${ rootDir }/lib/logger.js` );
let datetime = require( `${ rootDir }/lib/datetime.js` );
let dbms = require( `${ rootDir }/lib/dbms.js` );
let crm = require( `${ rootDir }/lib/crm.js` );
let telephone = require( `${ rootDir }/lib/telephone.js` );
let people = require( `${ rootDir }/lib/people.js` );
let slackConfiguration = require( slack__ConfigurationFilename );





const slack = new WebClient( slackConfiguration.accessToken );





/*
 *
 * Handle un-caught/handled exceptions and errors
 *
 */
async function shutdownGracefully ( e ) {
	let context = "There was an uncaught error or unhandled rejection";
	let message = e.toString();
	if ( e.stack )
		message += "\n```\n" + e.stack + "\n```";
	await log.toUs( {
		context: context,
		message: message
	} );
	console.error( context + "\n" + message );
	setTimeout( function () {
		console.log( "Terminating process right now." );
		process.exit( 1 );
	}, 1000 );
}
process.on( "uncaughtException", shutdownGracefully );
process.on( "unhandledRejection", shutdownGracefully );





( async function main () {

	let response;
	try {
		// response = await crm.setNotification( "00001" );
		response = await crm.getNotification( "00001" );
		console.log( response );
	}
	catch ( e ) {
		debugger;
	}


	/*
	 * We're done.
	 */
	process.exit( 0 );

}() );
