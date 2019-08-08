
// Exports
module.exports = main;





// Constants
let rootDir = __dirname + "/..";

/*
 *
 * Packages
 *
 */
// Third-party packages
let axios = require( "axios" );
let qs = require( "qs" );
// Our custom imports
let crm = require( `${ rootDir }/lib/crm.js` );


/*
 * -/-/-/-/-/
 * Research information on a customer, given their UID
 * -/-/-/-/-/
 */
function main ( router, middleware ) {

	router.get( "/someone", async function ( req, res ) {

		/*
		 * 1. First, fetch the customer from the CRM, based on the given UID
		 */
		let uid = req.query.uid;
		if ( ! uid ) {
			res.status( 404 );
			res.json( { message: "Please provide the UID of the customer." } );
			res.end();
			return;
		}

		let customer;
		try {
			customer = await crm.getCustomerByExternalId( uid );
		}
		catch ( e ) {
			res.status( 404 );
			res.json( {
				message: `Could not find a customer with the UID ${ uid }.`,
				e: e.message
			} );
			res.end();
			return;
		}

		/*
		 * 2. Now, query the person with the phone number(s) and email address(es)
		 */
		let phoneNumbers = [
			customer[ "Phone" ],
			customer[ "Mobile" ],
			customer[ "Home_Phone" ],
			customer[ "Other_Phone" ],
			customer[ "Asst_Phone" ]
		]
			.filter( number => number )
			.map( number => ({ number }) );

		let emailAddresses = [
			customer[ "Email" ],
			customer[ "Secondary_Email" ]
		]
			.filter( email => email )
			.map( email => ({ address: email }) );

		let response;
		try {
			response = await axios.post( "https://api.pipl.com/search/", qs.stringify( {
				key: "bbnpv2fw7rc7swd95e4cfdmw",
				person: JSON.stringify( {
					phones: phoneNumbers,
					emails: emailAddresses
				} )
			} ) );
		}
		catch ( e ) {
			res.status( 404 );
			res.json( {
				message: `Could not find a customer with the UID ${ uid }.`,
				e: e.message
			} );
			res.end();
			return;
		}

		res.json( { data: response.data } );
		res.end();

	} );

	return router;

}
