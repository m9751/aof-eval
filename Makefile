# aof-eval — canonical command front door (wraps package.json scripts)
.PHONY: help install dev build start lint test smoke

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

check:		## banned-token checks (no node_modules needed — always runnable)
	npm run lint:causal && npm run test:dc8

lint: check	## next lint (needs node_modules) + the banned-token checks
	npm run lint

verify: check	## the cold-agent verify gate: runs without install. Use 'make lint' once deps are installed.
	@echo "verify: banned-token gate passed. Run 'make install && make lint' for the full Next.js lint."

test: verify	## alias for verify (no unit-test suite; the banned-token gate + next lint are the gates)

smoke:		## live PTU-19 /api/rules window check (AOF_EVAL_BASE_URL override)
	bash tests/smoke/api-rules-ptu19.sh "$${AOF_EVAL_BASE_URL:-https://aof-eval.vercel.app}"
