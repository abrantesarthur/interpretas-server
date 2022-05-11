.PHONY: build run

build: src/index.ts tsconfig.json
	tsc

run: build
	node dist/index.js
