CHAOS_TEST_SCOPE ?= all
.PHONY: test lint-python lint-node

ifeq ($(CHAOS_TEST_SCOPE),all)
test: lint-python lint-node
else ifeq ($(CHAOS_TEST_SCOPE),python)
test: lint-python
else
test:
	@printf 'Invalid test scope. Use all or python.\n' >&2; exit 2
endif

lint-python:
	@cd "$${CHAOS_SOURCE_CHECKOUT:-$${CHAOS_CHECKOUT:?Set CHAOS_CHECKOUT}}" && "$${PYTHON:-python3}" "$(CURDIR)/python/lint.py"

lint-node:
	@npm ci --prefer-offline --ignore-scripts --no-audit --no-fund
	@cd "$${CHAOS_SOURCE_CHECKOUT:-$${CHAOS_CHECKOUT:?Set CHAOS_CHECKOUT}}" && "$${NODE:-node}" "$(CURDIR)/node/lint.mjs"
