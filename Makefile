.PHONY: install dev start build docker-build docker-run docker-stop docker-logs clean help

APP_NAME    := bomber
DOCKER_TAG  := $(APP_NAME):latest
CONTAINER   := $(APP_NAME)

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start in development mode
	node server.js

start: ## Start in production mode
	NODE_ENV=production node server.js

build: ## Build the project (no-op for pure Node.js)
	npm run build

clean: ## Remove node_modules
	rm -rf node_modules

docker-build: ## Build Docker image
	docker build -t $(DOCKER_TAG) .

docker-run: ## Run Docker container
	docker run -d --name $(CONTAINER) -p 9998:9998 -e NODE_ENV=production $(DOCKER_TAG)

docker-stop: ## Stop and remove Docker container
	docker stop $(CONTAINER) && docker rm $(CONTAINER)

docker-logs: ## Tail Docker container logs
	docker logs -f $(CONTAINER)
