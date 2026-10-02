# Prompt Manager

Prompt Manager is a lightweight, remote storage utility built to easily store, organize, and retrieve text prompts. 

🌟 **[Try it now!](https://promptmanager.pairpad.com)**

## 🏗️ Architecture
- **Frontend**: React application (bootstrapped with Create React App)
- **Backend**: Go (Golang) REST API using `gorilla/mux`
- **Database**: SQLite (stored in `./backend/data/templates.db`)

## 🚀 Running Locally

1. **Clone the repository**
2. **Set up Environment Variables**:
   Copy the example file and configure it if needed:
   ```bash
   cp .env.example .env
   ```
3. **Start with Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```
   - The **frontend** will be available at `http://localhost:3000`
   - The **backend** will be available at `http://localhost:7979`

## 🌍 Deployment on Dokploy

This application is ready to be deployed on Dokploy (or any standard Docker Compose environment).

### Prerequisites in Dokploy
Make sure you have your domains set up in Dokploy. For example:
1. A domain for the **Frontend** (e.g., `https://promptmanager.pairpad.com`)
2. A domain for the **Backend** API (e.g., `https://api.promptmanager.pairpad.com`)

### Dokploy Setup Steps
1. Create a new **Compose** deployment in Dokploy.
2. Connect your Git repository.
3. Add the following **Environment Variables** in the Dokploy UI for your deployment:
   ```env
   REACT_APP_API_URL=https://api.promptmanager.pairpad.com
   BACKEND_CORS_ORIGIN=https://promptmanager.pairpad.com
   ```
4. Dokploy will read the `docker-compose.yml` file in the root directory.
5. **Ports Configuration in Dokploy**:
   - Point your frontend domain (Traefik route) to the `frontend` service on port **`3000`**.
   - Point your backend domain (Traefik route) to the `backend` service on port **`7979`**.

### Database Configuration
The backend currently relies on a lightweight local **SQLite** database which is stored in the `./backend/data` directory. This is mounted as a Docker volume so your data persists across container restarts, keeping deployment simple without the need for a standalone PostgreSQL database.

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
