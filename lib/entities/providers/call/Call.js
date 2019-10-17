
// Exports
// module.exports = Call;





// Constants
let rootDir = __dirname + "/../../../..";

/*
 *
 * Packages
 *
 */
// Our custom imports


class Call {

	static getProvider ( name ) {
		let providerName = name[ 0 ].toUpperCase() + name.slice( 1 );
		let Provider;
		try {
			Provider = require( `./${ providerName }.js` );
		}
		catch ( e ) {
			throw new Error( `The call provider "${ providerName }" was not found.` );
		}
		return Provider;
	}

	static parseLog ( provider, log ) {
		let Provider = Call.getProvider( provider );
		return Provider.parse( log );
	}

}





module.exports = Call;
