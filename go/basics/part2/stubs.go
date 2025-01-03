package main

import "fmt"

func CreateUserEntry(user User) error {
	fmt.Printf("Creating user entry for %s\n", user.Name)
	return nil
}

func SendEmailWithLink(userID string, user User, secret string) error {
	fmt.Printf("Sending email to %s with secret %s. \n"+
		"To simulate a user clicking the link, run the following command: \n"+
		"curl localhost:8080/SignupWorkflow/%s/Click -H 'content-type: application/json' -d '\"%s\"'\n",
		user.Email, secret, userID, secret)
	return nil
}
