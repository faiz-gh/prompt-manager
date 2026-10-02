# Prompt Manager

Prompt Manager is a lightweight, remote storage utility built to easily store, organize, and retrieve text prompts. 

## 🏗️ Architecture
- **Frontend**: React application (bootstrapped with Create React App)
- **Backend**: Go (Golang) REST API using `gorilla/mux`
- **Database**: SQLite (stored in `./backend/data/templates.db`)

## 🚀 Running Locally

1. **Clone the repository**
2. **Start with Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```
   - The **frontend** will be available at `http://localhost:3000`
   - The **backend** will be available at `http://localhost:7979`

## 🌍 Deployment on Dokploy

This application is ready to be deployed on Dokploy using the provided `docker-compose.yml` file.

### Prerequisites in Dokploy
Make sure you have your domains set up in Dokploy. You will typically need:
1. A domain for the **Frontend** (e.g., `prompts.yourdomain.com`)
2. A domain for the **Backend** API (e.g., `api.prompts.yourdomain.com`)

*(Note: The current codebase has hardcoded domains `prompts.faizghanchi.com` and `api.prompts.faizghanchi.com` for API calls and CORS. You may need to update `frontend/src/App.jsx` and `backend/main.go` to match your actual domain before deployment).*

### Dokploy Setup Steps
1. Create a new **Compose** deployment in Dokploy.
2. Connect your Git repository.
3. Dokploy will read the `docker-compose.yml` file in the root directory.
4. **Ports Configuration in Dokploy**:
   - Point your frontend domain (Traefik route) to the `frontend` service on port **`3000`**.
   - Point your backend domain (Traefik route) to the `backend` service on port **`7979`**.

### Database Configuration
The backend currently relies on a lightweight local **SQLite** database which is stored in the `./backend/data` directory. This is mounted as a Docker volume so your data persists across container restarts. 

As per your deployment strategy, PostgreSQL has been removed from the Docker Compose file, and the application relies entirely on the integrated SQLite setup for simplicity. 

## 🛠️ Development

### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
cd backend
go mod download
go run main.go
```
