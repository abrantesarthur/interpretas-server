.PHONY: copy build run

build: src/index.ts tsconfig.json
	tsc
	npm run copy

run: build
	node dist/index.js
