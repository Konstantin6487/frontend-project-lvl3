install: install-deps

install-deps:
	npm install

develop:
	npx webpack-dev-server --port 8081 --env.mode development

build:
	npx webpack --env.mode production

lint:
	npx eslint .
