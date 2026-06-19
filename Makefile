# aof-eval — canonical command front door (wraps package.json scripts)
.PHONY: help install dev build start lint test

help:		## list targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  %-10s %s\n",$$1,$$2}'

install:	## npm install
	npm install

dev:		## next dev (local)
	npm run dev

build:		## next build
	npm run build

start:		## next start (serve build)
	npm run start

lint:		## next lint + banned-token checks
	npm run lint && npm run lint:causal && npm run test:dc8

test: lint	## alias for lint (no unit-test suite; lint is the gate)
