package main

import (
	"go-todo-api/internal/config"
	"go-todo-api/internal/database"
	"go-todo-api/internal/handlers"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	var cfg *config.Config
	var err error
	cfg, err = config.Load()

	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	var pool *pgxpool.Pool
	pool, err = database.Connect(cfg.DatabaseURL)

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	defer pool.Close()

	var router *gin.Engine = gin.Default()
	router.SetTrustedProxies(nil)

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message":  "Go Todo API running",
			"status":   "success",
			"database": "connected",
		})
	})

	router.POST("/todos", handlers.CreateTodoHandler(pool))
	router.GET("/todos", handlers.GetAllTodosHandler(pool))
	router.GET("/todos/:id", handlers.GetTodoByIdHandler(pool))
	router.PUT("/todos/:id", handlers.UpdateTodoHandler(pool))
	router.DELETE("/todos/:id", handlers.DeleteTodoHandler(pool))

	router.POST("/auth/register", handlers.CreateUserHandler(pool))
	router.POST("/auth/login", handlers.LoginHandler(pool, cfg))

	router.Run(":" + cfg.Port)
}
