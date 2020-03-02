{
	__schemaVersion: Number,
	client: String,	// the name client of the client, ex. LivingWalls
	externalId: String,	// the customer's external Id
	salespersonId: String,	// the salesperson's CRM Id
	when: Date,	// when this event took place
	ddmmyyyy: String,	// no, not a Date object, but like so "dd/mm/yyyy", used in index
	action: String,	// either "create" or "modify"
	resource: String,	// the resource that was created
	fieldName: String,	// the field name whose value was modified
	fieldValue: Object	// the field value that was modified
}
