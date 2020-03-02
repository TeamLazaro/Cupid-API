
module.exports = {
	getUnixTimestamp,
	getDateObject,
	getDateObjectForPresentation,
	getTimestampComponents,
	formatTimestamp,
	getTimestamp,
	getDateInNumeric
};





/*
 *
 * Packages
 *
 */
// Our custom imports
let utils = require( "./utils.js" );






/*
 * Constants
 */
let dateAt1900 = new Date( Date.UTC( 1900, 0, 1 ) );




function getUnixTimestamp () {
	return ( new Date() ).getTime();
}



/*
 *
 * Return a Date instance that reflects the given options
 *
 */
function getDateObject ( options ) {

	options = options || { };

	let now = new Date;
	let timezoneOffsetInMinutes = now.getTimezoneOffset();

	// Convert "representation" to UTC
	let timezoneOffsetInMilliseconds = timezoneOffsetInMinutes * 60 * 1000;
	let utcDate = new Date( now.getTime() + timezoneOffsetInMilliseconds );

	// Convert "representation" to desired locale
	timezoneOffsetInMilliseconds = 0;
	if ( options.timezone == "IST" )
		timezoneOffsetInMilliseconds = -1 * 330 * 60 * 1000;

	let dateObject = new Date( utcDate.getTime() + timezoneOffsetInMilliseconds );

	return dateObject;

}

/*
 *
 * Return a Date instance that reflects the given options
 *	( purely for presentational purposes )
 *
 */
function getDateObjectForPresentation ( options ) {

	options = options || { };

	let now = new Date;
	let timezoneOffsetInMinutes = now.getTimezoneOffset();

	// Convert "representation" to UTC
	let timezoneOffsetInMilliseconds = timezoneOffsetInMinutes * 60 * 1000;
	let utcDate = new Date( now.getTime() + timezoneOffsetInMilliseconds );

	// Convert "representation" to desired locale
	timezoneOffsetInMilliseconds = 0;
	if ( options.timezone == "IST" )
		timezoneOffsetInMilliseconds = 330 * 60 * 1000;

	let dateObject = new Date( utcDate.getTime() + timezoneOffsetInMilliseconds );

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
		dateObject = getDateObjectForPresentation( options );
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

	let dateObject = getDateObjectForPresentation( options );

	if ( format )
		return formatTimestamp( dateObject, format );
	else
		return dateObject;

}




function getDateInNumeric ( dateISOString, options ) {

	let numericDate = DATEVALUE( dateString ) + TIMEVALUE( dateString );

	if ( options.timezone == "IST" )
		numericDate += TIMEVALUE( ( 330 * 60 * 1000 ) );

	return numericDate;

}

function toDate ( value ) {

	if ( ! isNaN( value ) ) {

		if ( value instanceof Date )
			return new Date( value );

		let integer = parseInt( value, 10 );
		if ( integer < 0 )
			throw new Error( "Cannot coerce value to Date" );
		if ( integer <= 60 )
			return new Date( dateAt1900.getTime() + ( integer - 1 ) * 86400000 );

		return new Date( dateAt1900.getTime() + ( integer - 2 ) * 86400000 );

	}

	if ( typeof value === "string" ) {
		let date = new Date( value );
		if ( isNaN( date ) )
			throw new Error( "Cannot coerce value to Date" );
		else
			return date;
	}

	throw new Error( "Cannot coerce value to Date" );

}

function DATEVALUE ( dateString ) {
	let modifier = 2;
	let date;

	if ( typeof dateString !== "string" )
		throw new Error( "The Date provided is not in the form of a String." );

	date = Date.parse( dateString );

	if ( isNaN( date ) )
		throw new Error( "The Date String provided cannot be parsed to a valid Date." );

	if ( date <= -2203891200000 )
		modifier = 1;

	return Math.ceil( ( date - dateAt1900 ) / 86400000 ) + modifier;
}

function TIMEVALUE ( timeString ) {

	let date = toDate( timeString );

	let time = (
		3600 * date.getHours()
		+ ( 60 * date.getMinutes() )
		+ date.getSeconds()
	) / 86400;

	return time;

}
