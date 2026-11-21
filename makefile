.PHONY: db-up db-migrate api dev test

db-up:
	docker compose up -d postgres

db-migrate:
	npm run db:migrate

api:
	node --env-file=.env.local --run api

dev:
	npm run dev

test:
	go test ./...
	npm run lint
