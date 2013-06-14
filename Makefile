#REPORTER = spec
REPORTER = tap

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
        --reporter $(REPORTER) \
        --ui tdd
 
test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha \
        --reporter $(REPORTER) \
        --ui tdd \
        --watch
 
.PHONY: test test-w
