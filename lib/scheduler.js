
module.exports = {
	schedule
};





// Our custom imports
let log = require( "./logger.js" );

// Keep a record of all the jobs
let jobs = [ ];

function schedule ( task, interval ) {

	interval = interval * 1000;
	let status = null;
	let timerId = null;

	/*
	 *
	 * This function simply schedules an execution of the task based on the
	 * given interval
	 *
	 */
	function scheduleNextExecution () {

		if ( status != "running" )
			return;

		timerId = setTimeout( runAndScheduleTask, interval );

	}

	/*
	 *
	 * This function simply runs the task,
	 * passing in the `scheduleNextExecution` function as a callback to be
	 * exectued once the task is finished. This is because the tasks are async.
	 *
	 */
	async function runAndScheduleTask () {
		await task();
		scheduleNextExecution();
	}

	/*
	 *
	 * This is the API that we're returning
	 *
	 */
	let job = {
		get status () {
			return status;
		},
		set status ( message ) {
			status = message;
		},
		start: function () {
			if ( status == "running" ) return;
			status = "running";
			scheduleNextExecution();
		},
		stop: function () {
			status = "stopped";
			clearTimeout( timerId );
			timerId = null;
			return true;
		},
	};
	jobs.push( job );

	return job;

}





process.on( "SIGINT", function () {

	log.toConsole( "Stopping all scheduled jobs....." );
	jobs.forEach( job => job.stop() );
	log.toConsole( "All scheduled jobs have been stopped." );

} );
