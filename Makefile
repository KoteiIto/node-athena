build: clean
	yarn run build

test:
	yarn run test

coveralls: 
	yarn coveralls

clean:
	rm -rf build | rm -rf coverage