package main

import (
	"fmt"
	"log/slog"
	"math/rand"
	"time"
)

func createS3Bucket() string {
	bucket := fmt.Sprintf("%x", rand.Intn(1_000_000_000))
	bucketUrl := fmt.Sprintf("https://s3-eu-central-1.amazonaws.com/%s/", bucket)
	slog.Info(fmt.Sprintf(" >>> Creating bucket with URL %s", bucketUrl))
	return bucketUrl
}

func uploadData(url string) error {
	timeRemaining := 1500
	if rand.Float32() < 0.5 {
		timeRemaining = 10000
	}
	slog.Info(fmt.Sprintf(" >>> Uploading data to target %s. ETA: %dms", url, timeRemaining))
	// non-resilient sleep
	time.Sleep(time.Duration(timeRemaining) * time.Millisecond)
	return nil
}

func sendEmail(email string, url string) error {
	slog.Info(fmt.Sprintf(" >>> Sending email to '%s' with URL %s", email, url))
	return nil
}
