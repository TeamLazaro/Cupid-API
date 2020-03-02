{
	__schemaVersion: Number,
	client: String,
	interest: String,
	phoneNumber: String,
	name: String,
	dateOfBirth: Date,
	images: [ String ],
	contact: {
		otherPhoneNumbers: [ String ],
		otherEmailAddresses: [ String ]
	},
	onTheInternet: [ { name: String, url: String } ],
	career: [ String ],
	beganCareerOn: Date,
	education: [ String ],
	meta: {
		spam: Boolean,
		error: Boolean,
		errorMessage: String,
		createdOn: Date,
		source: String,	// did this person come from the CRM or website
		phoneNumberIsValid: String,
		identityVerified: Boolean,
		fetchedInformationOn: Date,
		onCRM: Boolean,
		clientIds: [ String ],
		crmInternalId: String,
		crmExternalId: String,
		piplSearchId: String
	},
	actions: {
		research: Boolean,
		addToCRM: Boolean,	// if Cupid was the one who ingested the person into the CRM
		syncToCRM: Boolean,	// if the research information has been reflected to the CRM
		validatePhoneNumber: Boolean,
		gatherInformation: Boolean,
		introduceToSalespeople: Boolean
	}
}
