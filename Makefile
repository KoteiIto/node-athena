mocha=./node_modules/.bin/_mocha
istanbul=./node_modules/.bin/istanbul

test: clean
	$(mocha)

test-cov: clean
	$(istanbul) cover $(mocha) -- -R spec test/*

coveralls: 
	cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js;

clean:
	rm -fr coverage