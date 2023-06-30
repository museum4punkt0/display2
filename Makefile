.phony: quick

quick:
	tsc --noEmit
	npm run lint:fixstaged || true
	rg -i '\b(todo|xxx|fixme)\b' src

.phony: check

check:
	tsc --noEmit
	npm run test:ci
	npm run lint:fixstaged || true
	rg -i '\b(todo|xxx|fixme)\b' src

.phony: clean

clean:
	rm -rf build/ dist/ coverage/
	rm -f junit.xml


.phony: build

build:
	rm -rf build/ dist/
	npm run build