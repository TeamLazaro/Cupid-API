
// Exports
// module.exports = InsightMakerResolver;





class InsightMakerResolver {

	static get ( slug ) {
		let nameParts = slug
			.split( /[\s\-]+/ )
			.map( part => `${ part[ 0 ].toUpperCase() }${ part.slice( 1 ) }` );
		let formattedName = nameParts.join( "" );

		let InsightMaker;
		try {
			InsightMaker = require( `${ __dirname }/${ formattedName }.js` );
		}
		catch ( e ) {
			throw new Error( `The Insight Maker "${ nameParts.join( " " ) }" does not exist.` );
		}

		return InsightMaker;
	}

}





module.exports = InsightMakerResolver;
