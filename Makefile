up:
	docker compose -f docker-compose.yml up -d

down:
	docker compose -f docker-compose.yml down

dev:
	npm run dev

set-up:
	npm install
	make dev