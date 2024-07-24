package main

import (
	"fmt"

	restate "github.com/restatedev/sdk-go"
)

// Greeter is a struct which represents a Restate service; reflection will turn exported methods into service handlers
type Greeter struct{}

func (Greeter) Greet(ctx restate.Context, greeting string) (string, error) {
	return fmt.Sprintf("%s!", greeting), nil
}
