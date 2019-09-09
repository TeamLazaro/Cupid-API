
module.exports = {
	getUnixTimestamp,
	getDateObject,
	getTimestampComponents,
	formatTimestamp,
	getTimestamp
};





/*
 *
 * Packages
 *
 */
// Our custom imports
let utils = require( "./utils.js" );





function getUnixTimestamp () {
	return ( new Date() ).getTime();
}



/*
 *
 * Return a Date instance that reflects the given options
 *
 * TODO: Factor in the system timezone that is already set ( use `getTimezoneOffset` )
 *
 */
function getDateObject ( options ) {

	options = options || { };

	let offset = 0;
	if ( options.timezone == "IST" )
		offset = 330 * 60 * 1000;

	let dateObject = new Date( ( new Date() ).getTime() + offset );

	return dateObject;

}

/*
 *
 *
 * Get the individual components of a timestamp
 *
 *
 */
function getTimestampComponents ( timestamp_Or_Options, options ) {

	let dateObject;
	if ( timestamp_Or_Options instanceof Date ) {
		// options = options || { };
		dateObject = timestamp_Or_Options;
	}
	else {
		options = timestamp_Or_Options || { };
		dateObject = getDateObject( options );
	}

	// Date components
		// Year
	let year = dateObject.getUTCFullYear();
		// Month
	let month = ( dateObject.getUTCMonth() + 1 );
		// Day
	let day = dateObject.getUTCDate();

	// Time components
		// Hours
	let hours = dateObject.getUTCHours();
		// Minutes
	let minutes = dateObject.getUTCMinutes();
		// Seconds
	let seconds = dateObject.getUTCSeconds();
		// Milli-seconds
	let milliseconds = dateObject.getUTCMilliseconds();

	return {
		day,
		month,
		year,
		hours,
		minutes,
		seconds,
		milliseconds
	};

}



/*
 *
 * Formats a timestamp to the given format
 *
 */
function formatTimestamp ( timestamp, format ) {

	let {
		day,
		month,
		year,
		hours,
		minutes,
		seconds,
		milliseconds
	} = getTimestampComponents( timestamp )

	if ( format == "d/m/Y" )
		return `${ day.toString().padStart( 2, 0 ) }/${ month.toString().padStart( 2, 0 ) }/${ year }`;
	else if ( format == "g:i a\td/m/Y" ) {
		hours = hours == 12 ? 12 : hours % 12;
		let meridiems = hours > 11 ? "pm" : "am";
		minutes = minutes.toString().padStart( 2, 0 );
		day = day.toString().padStart( 2, 0 );
		month = month.toString().padStart( 2, 0 );
		return `${ hours }:${ minutes } ${ meridiems }\t${ day }/${ month }/${ year }`;
	}
	else
		return `${ year }${ month.toString().padStart( 2, 0 ) }${ day.toString().padStart( 2, 0 ) } ${ hours.toString().padStart( 2, 0 ) }${ minutes.toString().padStart( 2, 0 ) }${ seconds.toString().padStart( 2, 0 ) }${ milliseconds }`;

}



/*
 *
 * Returns either a Date instance or a formatted string
 * 	representing the current timestamp.
 *
 */
function getTimestamp ( format_Or_Options, options ) {

	let format;
	if ( typeof format_Or_Options == "string" ) {
		options = options || { };
		format = format_Or_Options;
	}
	else {
		options = timestamp_Or_Options || { };
		format = options.format;
	}

	let dateObject = getDateObject( options );

	if ( format )
		return formatTimestamp( dateObject, format );
	else
		return dateObject;

}
