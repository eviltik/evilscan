#REPORTER = spec
REPORTER = tap

test:
	@NODE_ENV=tests ./node_modules/.bin/mocha \
        --reporter $(REPORTER) \
        --ui tdd
 
test-w:
	@NODE_ENV=tests ./node_modules/.bin/mocha \
        --reporter $(REPORTER) \
        --ui tdd \
        --watch
 
.PHONY: test test-w
