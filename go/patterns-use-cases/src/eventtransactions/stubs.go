package main

import (
	"fmt"
	"github.com/google/uuid"
	"math/rand"
)

const (
	PENDING = "PENDING"
	DONE    = "DONE"
)

func CreatePost(userId string, post SocialMediaPost) (string, error) {
	postId := uuid.New().String()
	fmt.Printf("Created post %s for user %s with content: %s\n", postId, userId, post.Content)
	return postId, nil
}

func GetPostStatus(postId string) string {
	if rand.Float32() < 0.8 {
		fmt.Printf("Content moderation for post %s is still pending... Will check again in 5 seconds\n", postId)
		return PENDING
	} else {
		fmt.Printf("Content moderation for post %s is done\n", postId)
		return DONE
	}
}

func UpdateUserFeed(user string, postId string) error {
	fmt.Printf("Updating the user feed for user %s with post %s\n", user, postId)
	return nil
}
