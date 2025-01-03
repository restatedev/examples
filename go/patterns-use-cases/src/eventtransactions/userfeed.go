package main

import (
	"context"
	restate "github.com/restatedev/sdk-go"
	"github.com/restatedev/sdk-go/server"
	"log"
)

type SocialMediaPost struct {
	Content  string `json:"content"`
	Metadata string `json:"metadata"`
}

// Processing events (from Kafka) to update various downstream systems
//  - Journaling actions in Restate and driving retries from Restate, recovering
//    partial progress
//  - Preserving the order-per-key, but otherwise allowing high-fanout, because
//    processing of events does not block other events.
//  - Ability to delay events when the downstream systems are busy, without blocking
//    entire partitions.

type UserFeed struct{}

// The Kafka key routes events to the correct Virtual Object.
// Events with the same key are processed one after the other.

func (UserFeed) ProcessPost(ctx restate.ObjectContext, post SocialMediaPost) error {
	var userId = restate.Key(ctx)
	postId, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
		return CreatePost(userId, post)
	})
	if err != nil {
		return err
	}

	// Delay processing until content moderation is complete (handler suspends when on FaaS).
	// This only blocks other posts for this user (Virtual Object), not for other users.
	for {
		status, err := restate.Run(ctx, func(ctx restate.RunContext) (string, error) {
			return GetPostStatus(postId), nil
		})
		if err != nil {
			return err
		}
		if status != PENDING {
			break
		}
		err = restate.Sleep(ctx, 5000)
		if err != nil {
			return err
		}
	}

	if _, err := restate.Run(ctx, func(ctx restate.RunContext) (restate.Void, error) {
		return restate.Void{}, UpdateUserFeed(userId, postId)
	}); err != nil {
		return err
	}

	return nil
}

func main() {
	if err := server.NewRestate().
		Bind(restate.Reflect(UserFeed{})).
		Start(context.Background(), "0.0.0.0:9080"); err != nil {
		log.Fatal(err)
	}
}

// Process new posts for users via Kafka or by calling the endpoint over HTTP:
/*
curl localhost:8080/UserFeed/userid1/ProcessPost -H 'content-type:application/json' -d '{"content": "Hi! This is my first post!", "metadata": "public"}' &&
curl localhost:8080/UserFeed/userid2/ProcessPost -H 'content-type:application/json' -d '{"content": "Hi! This is my first post!", "metadata": "public"}' &&
curl localhost:8080/UserFeed/userid1/ProcessPost -H 'content-type:application/json' -d '{"content": "Hi! This is my second post!", "metadata": "public"}'
*/
