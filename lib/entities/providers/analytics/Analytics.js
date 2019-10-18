
// Exports
// module.exports = Analytics;





// Constants
let rootDir = __dirname + "/../../../..";

/*
 *
 * Packages
 *
 */
// Our custom imports


class Analytics {

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
			throw new Error( `The Analytics service "${ readableName.join( " " ) }" was not found.` );
		}

		return Service;
	}

}





module.exports = Analytics;
