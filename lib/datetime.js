
module.exports = {
	getUnixTimestamp,
	getDatetimeStamp,
	getDateObject,
	waitFor
};





function getUnixTimestamp () {
	return ( new Date() ).getTime();
}

function getDateObject () {
	var dateObject = new Date();
	// if ( dateObject.getTimezoneOffset() == -330 )
	// 	return dateObject;

	var ISTOffset = 330 * 60 * 1000;
	dateObject = new Date( dateObject.getTime() + ISTOffset );
	return dateObject;
}

/*
 *
 *
 * Get the current time and date stamp
 *	in Indian Standard Time
 *
 *	reference
 *		https://stackoverflow.com/questions/22134726/get-ist-time-in-javascript
 *
 */
function getDatetimeStamp ( options ) {

	options = options || { };
	var ISTOffset = 330 * 60 * 1000;
	var dateObject = new Date( ( new Date() ).getTime() + ISTOffset );

	// Date components
		// Year
	var year = dateObject.getUTCFullYear();
		// Month
	var month = ( dateObject.getUTCMonth() + 1 );
	if ( month < 10 ) month = "0" + month;
		// Day
	var day = dateObject.getUTCDate();
	if ( day < 10 ) day = "0" + day;

	// Time components
		// Hours
	var hours = dateObject.getUTCHours();
	if ( hours < 10 ) hours = "0" + hours;
		// Minutes
	var minutes = dateObject.getUTCMinutes();
	if ( minutes < 10 ) minutes = "0" + minutes;
		// Seconds
	var seconds = dateObject.getUTCSeconds();
	if ( seconds < 10 ) seconds = "0" + seconds;
		// Milli-seconds
	var milliseconds = dateObject.getUTCMilliseconds();
	if ( milliseconds < 10 ) milliseconds = "00" + milliseconds;
	else if ( milliseconds < 100 ) milliseconds = "0" + milliseconds;

	// Assembling all the parts
	var datetimestamp = day
				+ "/" + month
				+ "/" + year

				+ " " + hours
				+ ":" + minutes
				+ ":" + seconds
				// + "." + milliseconds

	if ( options.separator )
		datetimestamp = datetimestamp.replace( /[\/:\.]/g, options.separator );

	return datetimestamp;

}

/*
 *
 * Wait for the specified number of seconds.
 * This facilitates a Promise or syncrhonous (i.e., using async/await ) style
 * 	of programming
 *
 */
function waitFor ( seconds ) {
	return new Promise( function ( resolve, reject ) {
		setTimeout( function () {
			resolve();
		}, seconds * 1000 );
	} );
}
