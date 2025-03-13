package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

type Template struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

var db *sql.DB

func main() {
	var err error
	// Open SQLite database file inside data folder
	db, err = sql.Open("sqlite3", "./data/templates.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Create table if it doesn't exist
	createTable := `
	CREATE TABLE IF NOT EXISTS templates (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(createTable)
	if err != nil {
		log.Fatal(err)
	}

	// Set up router and endpoints
	r := mux.NewRouter()

	// 1. Apply CORS middleware
	r.Use(corsMiddleware)

	// 2. Define routes and include "OPTIONS" in Methods
	r.HandleFunc("/templates", getTemplates).Methods("GET", "OPTIONS")
	r.HandleFunc("/templates", createTemplate).Methods("POST", "OPTIONS")
	r.HandleFunc("/templates/{id}", getTemplate).Methods("GET", "OPTIONS")
	r.HandleFunc("/templates/{id}", updateTemplate).Methods("PUT", "OPTIONS")
	r.HandleFunc("/templates/{id}", deleteTemplate).Methods("DELETE", "OPTIONS")

	log.Println("Server running on https://api.prompts.faizghanchi.com")
	log.Fatal(http.ListenAndServe(":7979", r))
}

// corsMiddleware sets the CORS headers for each response
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Change "*" to specific domain if needed, e.g. "http://localhost:3000"
		w.Header().Set("Access-Control-Allow-Origin", "https://prompts.faizghanchi.com")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// If it's an OPTIONS request, just return 200 OK without further processing
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func getTemplates(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, content, created_at, updated_at FROM templates")
	if err != nil {
		http.Error(w, "Failed to query templates", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	templates := []Template{}
	for rows.Next() {
		var t Template
		if err := rows.Scan(&t.ID, &t.Name, &t.Content, &t.CreatedAt, &t.UpdatedAt); err != nil {
			http.Error(w, "Error scanning template", http.StatusInternalServerError)
			return
		}
		templates = append(templates, t)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(templates)
}

func createTemplate(w http.ResponseWriter, r *http.Request) {
	var t Template
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	stmt, err := db.Prepare("INSERT INTO templates (name, content) VALUES (?, ?)")
	if err != nil {
		http.Error(w, "Failed to prepare statement", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	result, err := stmt.Exec(t.Name, t.Content)
	if err != nil {
		http.Error(w, "Template name might be duplicate", http.StatusBadRequest)
		return
	}
	lastID, _ := result.LastInsertId()
	t.ID = int(lastID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(t)
}

func getTemplate(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]
	row := db.QueryRow("SELECT id, name, content, created_at, updated_at FROM templates WHERE id = ?", id)

	var t Template
	if err := row.Scan(&t.ID, &t.Name, &t.Content, &t.CreatedAt, &t.UpdatedAt); err != nil {
		http.Error(w, "Template not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(t)
}

func updateTemplate(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]
	var t Template
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	stmt, err := db.Prepare("UPDATE templates SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
	if err != nil {
		http.Error(w, "Failed to prepare statement", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(t.Name, t.Content, id)
	if err != nil {
		http.Error(w, "Failed to update template", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func deleteTemplate(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]
	stmt, err := db.Prepare("DELETE FROM templates WHERE id = ?")
	if err != nil {
		http.Error(w, "Failed to prepare statement", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(id)
	if err != nil {
		http.Error(w, "Failed to delete template", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
