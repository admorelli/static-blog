# Makefile for static_blog project

# Core commands (using npm scripts)

device:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

seed:
	npm run seed

# Drizzle ORM helpers

drizzle-generate:
	npm run drizzle:generate

drizzle-push:
	npm run drizzle:push

# Test suites

test-unit:
	npm run test:unit

test-e2e:
	npm run test:e2e

# Convenience alias

test: test-unit test-e2e
