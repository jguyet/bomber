.PHONY: help install build start dev docker-build docker-run docker-stop clean

IMAGE_NAME ?= bomber
IMAGE_TAG  ?= latest
PORT       ?= 8060
CONTAINER  ?= bomber-app

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install Node.js dependencies
	npm install

build: ## Run build step (static client — no compile needed)
	npm run build

start: ## Start the production server
	npm start

dev: ## Start the server in development mode
	npm run dev

docker-build: ## Build Docker image
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .

docker-run: ## Run the game in Docker
	docker run -d \
	  --name $(CONTAINER) \
	  -p $(PORT):$(PORT) \
	  --restart unless-stopped \
	  $(IMAGE_NAME):$(IMAGE_TAG)
	@echo "Game running at http://localhost:$(PORT)"

docker-stop: ## Stop and remove Docker container
	docker stop $(CONTAINER) || true
	docker rm $(CONTAINER) || true

docker-logs: ## Tail Docker container logs
	docker logs -f $(CONTAINER)

clean: ## Remove node_modules
	rm -rf node_modules
