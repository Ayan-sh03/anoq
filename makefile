
migrate-apply:
	edgedb migration create && edgedb migration apply

migrate-create:
	edgedb migration create

migrate-rollback:
	edgedb migration rollback

ui:
	edgedb ui
