build: clean
	npm run build

test:
	npm test

coveralls: 
	npm run coveralls

clean:
	rm -rf build | rm -rf coverage