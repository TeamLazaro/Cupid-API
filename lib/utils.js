
// Exports
module.exports = {
	waitFor
}





function waitFor ( seconds ) {
	if ( ! seconds && seconds <= 0 )
		seconds = 1;
	let milliseconds = seconds * 1000;
	return new Promise( function ( resolve ) {
		setTimeout( resolve, milliseconds )
	} );
}
