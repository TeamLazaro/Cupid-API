
// Exports
// module.exports = AnalyticsReporting;





// Constants
let rootDir = __dirname + "/../../../..";

/*
 *
 * Packages
 *
 */
// Our custom imports


class AnalyticsReporting {

	static getService ( name ) {
		let readableName = name
			.split( /[\s\-]+/ )
			.map( part => `${ part[ 0 ].toUpperCase() }${ part.slice( 1 ) }` );
		let formattedName = readableName.join( "" );

		let Service;
		try {
			Service = require( `${ __dirname }/${ formattedName }.js` );
		}
		catch ( e ) {
			throw new Error( `The Analytics reporting service "${ readableName.join( " " ) }" was not found.` );
		}

		return Service;
	}

}





module.exports = AnalyticsReporting;
