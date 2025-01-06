package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"
)

const RESTATE_URL = "http://localhost:8080"

type TaskOpts struct {
	Id          string `json:"id"`
	Description string `json:"description"`
}

func SubmitAndAwaitTask(task TaskOpts) error {
	idempotencyKey := task.Id
	slog.Info("Submitting task with idempotency key: " + idempotencyKey)
	client := &http.Client{Timeout: 5 * time.Second}

	// submit the task; similar to publishing a message to a queue (by adding /send to the url)
	// Restate ensures the task is executed exactly once
	// Optionally set a delay for the task by adding `?delay=10s` to the URL
	url := fmt.Sprintf("%s/AsyncTaskWorker/RunTask/Send", RESTATE_URL)
	taskData, _ := json.Marshal(task)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(taskData))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	// use a stable uuid as an idempotency key; Restate deduplicates for us
	req.Header.Set("idempotency-key", idempotencyKey)

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// ... do other things while the task is being processed ...

	// Later on, you can retrieve the result of the task
	attachUrl := fmt.Sprintf("%s/restate/invocation/AsyncTaskWorker/RunTask/%s/attach", RESTATE_URL, idempotencyKey)
	resp, err = http.DefaultClient.Get(attachUrl)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// ... Process the result ...

	return nil
}

func main() {
	task := TaskOpts{
		Id:          "task1",
		Description: "some heavy work",
	}
	err := SubmitAndAwaitTask(task)
	if err != nil {
		slog.Error("Task submission failed", "err", err.Error())
		return
	}
	slog.Info("Task submitted successfully")
}
