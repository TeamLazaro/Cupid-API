
/*
 *
 * This module has functions for logging
 *
 */

module.exports = {
	toConsole
};





function toConsole ( ...things ) {

	if ( process.env.NODE_ENV == "production" )
		return;

	console.log( ...things );

}
