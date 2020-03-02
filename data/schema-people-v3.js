{
	__schema: Number,
	createdOn: Date,
	lastModifiedAt: Date,
	// A human-readable (alpha-)numeric string, preferably short
	id: String,
	// The company or the brand behind the product(s)
		// Examples, LivingWalls
	client: String,
	phoneNumber: String,
	// Examples – Another Night's "A-151" and Secret Land's "D-119"
	interests: [ { date: Date, product: String, variant: String, attributes: Object } ],
	source: {
		// Where was this person's first place of contact?
			// Examples – Website, Phone, On-site, In-person
		medium: String,
		// Point on the place where the person initiated contact
			// Examples – Contact section, Salesperson A, North-east totem, Salesperson B
		point: String
	}
	verification: {
		isVerified: Boolean,
		// OTP, direct correspondence, or some other method
		method: String
	},
	deviceIds: [ String ],
	name: String,
	emailAddresses: [ String ],
	research: Object,
	issues: [ { name: String, details: String } ]
}
