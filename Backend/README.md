# Backend Setup

## Prerequisites
- Node.js (v16+)
- Docker

## Running Locally

1. **Start MongoDB and MQTT Broker**
```bash
docker-compose up -d
```

2. **Install dependencies**
```bash
npm install
```

3. **Start server**
```bash
npm start
```

Server runs on `http://localhost:8000`

## Testing with Postman

Import `postman_collection.json` to test all API endpoints.

## Stop Services
```bash
# Stop backend: Ctrl + C
# Stop Docker: docker-compose down
```