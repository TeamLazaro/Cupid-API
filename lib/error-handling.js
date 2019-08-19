
module.exports = {
	shutdownGracefully
};





async function shutdownGracefully ( e ) {
	let context = "There was an uncaught error or unhandled rejection";
	let message = e.toString();
	if ( e.stack )
		message += "\n```\n" + e.stack + "\n```";
	await log.toUs( {
		context: context,
		message: message
	} );
	console.error( context + "\n" + message );
	setTimeout( function () {
		console.log( "Terminating process right now." );
		process.exit( 1 );
	}, 1000 );
}
