
// Exports
module.exports = {
	waitFor
}





function waitFor ( seconds ) {
	let milliseconds = ( seconds || 1 ) * 1000;
	return new Promise( resolve => {
		setTimeout( resolve, milliseconds )
	} );
}
