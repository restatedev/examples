package main

import (
	"context"
	"fmt"
	"github.com/restatedev/sdk-go/server"
	"log/slog"
	"os"

	restate "github.com/restatedev/sdk-go"
)

func sendEmail(log *slog.Logger, username string, id string) error {
	log.Info("Sending email to activate account %s. To simulate the click on the email button, send a request to: POST http://localhost:8080/restate/awakeables/%s/resolve", username, id)
	return nil
}

type userObject struct{}

func (t *userObject) ServiceName() string { return "User" }

type User struct {
	Name     string `json:"name"`
	Surname  string `json:"surname"`
	Password string `json:"password"`
}

// Initialize will initialize the user object
func (t *userObject) Initialize(ctx restate.ObjectContext, user User) error {
	// Check if the user doesn't exist first
	usr, err := restate.Get[*User](ctx, "user")
	if err != nil {
		return err
	}
	if usr != nil {
		return restate.TerminalError(fmt.Errorf("the user was already initialized"))
	}

	// Store the user
	restate.Set(ctx, "user", user)

	// Store the unactivated status
	restate.Set(ctx, "activated", false)

	return nil
}

// Activate will signal the user is activated
func (t *userObject) Activate(ctx restate.ObjectContext) error {
	// Check if the user exists first
	usr, err := restate.Get[*User](ctx, "user")
	if err != nil {
		return err
	}
	if usr == nil {
		return restate.TerminalError(fmt.Errorf("the user doesn't exist"))
	}

	// Store the activated status
	restate.Set(ctx, "activated", true)

	return nil
}

// Get will return the current user, if any
func (t *userObject) Get(ctx restate.ObjectSharedContext) (User, error) {
	return restate.Get[User](ctx, "user")
}

type NewUser struct {
	Username string `json:"username"`
	Name     string `json:"name"`
	Surname  string `json:"surname"`
	Password string `json:"password"`
}

type signupService struct{}

func (t *signupService) ServiceName() string { return "Signup" }

func (t *signupService) Signup(ctx restate.Context, newUser NewUser) (string, error) {
	// Initialize the newUser first
	user := User{
		Name:     newUser.Name,
		Surname:  newUser.Surname,
		Password: newUser.Password,
	}
	_, err := restate.Object[restate.Void](ctx, "User", newUser.Username, "Initialize").Request(user)
	if err != nil {
		return "", err
	}

	// Prepare an awakeable to await the email activation
	awakeable := restate.Awakeable[restate.Void](ctx)

	// Send the activation email
	_, err = restate.Run[restate.Void](ctx, func(ctx restate.RunContext) (restate.Void, error) {
		err := sendEmail(ctx.Log(), newUser.Username, awakeable.Id())
		return restate.Void{}, err
	})
	if err != nil {
		return "", err
	}

	// Await the activation
	_, err = awakeable.Result()
	if err != nil {
		return "", err
	}

	// Activate the user
	_, err = restate.Object[restate.Void](ctx, "User", newUser.Username, "Activate").Request(user)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("The new user %s is signed up and activated", newUser.Username), nil
}

func main() {
	// Read PORT env injected by Knative Serving
	port := os.Getenv("PORT")
	if port == "" {
		port = "9080"
	}
	bindAddress := fmt.Sprintf(":%s", port)

	// Bind userObject to the Restate HTTP server
	srv := server.NewRestate().
		Bind(restate.Reflect(&userObject{})).
		Bind(restate.Reflect(&signupService{}))

	// Start server
	if err := srv.Start(context.Background(), bindAddress); err != nil {
		slog.Error("application exited unexpectedly", "err", err.Error())
		os.Exit(1)
	}
}
