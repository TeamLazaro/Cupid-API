
/*
 *
 * This module has functions relating to searching information on people
 *
 */

module.exports = {
	getDataOnPerson
};

// Constants
let rootDir = __dirname + "/../";
let configurationFilename = rootDir + "environment/configuration/pipl.json";

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
let log = require( "./logger.js" );





async function getDataOnPerson ( phoneNumbers, emailAddresses ) {

	phoneNumbers = phoneNumbers.filter( phoneNumber => phoneNumber );
	emailAddresses = emailAddresses.filter( emailAddress => emailAddress );

	let response;
	response = await axios.post( configuration.endpoint, qs.stringify( {
		key: configuration.accessKey,
		person: JSON.stringify( {
			phones: phoneNumbers.map( phoneNumber => ({ number: phoneNumber }) ),
			emails: emailAddresses.map( emailAddress => ({ address: emailAddress }) )
		} )
	} ) );

	if ( response.data[ "@http_status_code" ] !== 200 )
		throw new Error( `[${ response.data[ "@http_status_code" ] }] ${ response.data.error }` );

	// If warnings were returned, report them
	if ( response.data.warnings )
		await log.toUs( {
			context: "Querying information on a person",
			message: `[${ response.data[ "@http_status_code" ] }] Warnings:\n${ response.data.warnings.join( "\n" ) }`
		} );

	if ( response.data[ "@persons_count" ] == 0 )
		return {
			searchId: response.data[ "@search_id" ],
			people: [ ]
		};
	else if ( response.data[ "@persons_count" ] > 1 )
		return {
			searchId: response.data[ "@search_id" ],
			people: response.data.possible_persons
		};

	/*
	 * Shape the structure of the person object
	 */
	let data = response.data.person;

	let retrievedPhoneNumbers = [ ];
	if ( data.phones.length )
		retrievedPhoneNumbers = data.phones.map( phone => `+${ phone.country_code }${ phone.number }` );

	let retrievedEmailAddresses = [ ];
	if ( data.emails.length )
		retrievedEmailAddresses = data.emails.map( email => email.address );

	// Compile all the phone numbers and email addresses
	let allPhoneNumbers = Array.from( new Set( phoneNumbers.concat( retrievedPhoneNumbers ) ) );
	let allEmailAddresses = Array.from( new Set( emailAddresses.concat( retrievedEmailAddresses ) ) );

	let person = { };
	if ( allPhoneNumbers.length )
		person.phoneNumber = allPhoneNumbers[ 0 ];
	if ( allEmailAddresses.length )
		person.emailAddress = allEmailAddresses[ 0 ];
	if ( data.names.length )
		person.name = data.names[ 0 ].display;
	if ( data.dob )
		person.dateOfBirth = new Date( data.dob.date_range.start );
	// Retrieve the images that "are" accessible
	if ( data.images ) {
		person.images = [ ];
		for ( let _i = 0; _i < data.images.length; _i += 1 ) {
			let imageUrl = data.images[ _i ].url;
			let response;
			try {
				response = await axios.get( imageUrl );
			}
			catch ( e ) {
				if ( e.isAxiosError )
					response = e.response;
			}
			if ( response.status == 200 )
				person.images.push( imageUrl );
		}
	}

	person.contact = {
		otherPhoneNumbers: allPhoneNumbers.slice( 1 ),
		otherEmailAddresses: allEmailAddresses.slice( 1 )
	};

	if ( data.urls )
		person.onTheInteret = data.urls.map( place => {
			return {
				name: place[ "@name" ] || place[ "@domain" ],
				url: place.url
			}
		} );

	if ( data.jobs ) {
		person.career = data.jobs.map( job => job.display );
		// Determine the year when their career began
		let datesInCareer = data.jobs
			.filter( job => job.date_range )
			// .flatMap( job => [ job.date_range.start, job.date_range.end ] )
			.map( job => [ job.date_range.start, job.date_range.end ] )
			.reduce( ( acc, jobDates ) => acc.concat( jobDates ), [ ] )
			.filter( date => date )
			.map( date => new Date( date ) )
			.sort( ( a, b ) => a - b );
		if ( datesInCareer.length )
			person.beganCareerOn = datesInCareer[ 0 ]
	}

	if ( data.educations )
		person.education = data.educations.map( education => education.display );

	return {
		searchId: response.data[ "@search_id" ],
		people: [ person ]
	};

}
