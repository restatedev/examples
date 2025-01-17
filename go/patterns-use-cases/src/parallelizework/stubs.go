package main

import (
	restate "github.com/restatedev/sdk-go"
	"log"
	"math/rand"
	"strings"
	"time"
)

type Task struct {
	// Task fields
	Description string `json:"description"`
}

type SubTask struct {
	// SubTask fields
	Description string `json:"description"`
}

type SubTaskResult struct {
	Description string `json:"description"`
}

type Result struct {
	Description string `json:"description"`
}

func split(task Task) ([]SubTask, error) {
	// Split the task into subTasks
	subtaskDescriptions := strings.Split(task.Description, ",")

	subTasks := make([]SubTask, 0, len(subtaskDescriptions))
	for _, description := range subtaskDescriptions {
		subTasks = append(subTasks, SubTask{Description: description})
	}

	return subTasks, nil
}

func executeSubtask(ctx restate.Context, subtask SubTask) (SubTaskResult, error) {
	// Execute subtask
	log.Printf("Started executing subtask: %s\n", subtask.Description)
	// sleep for a random amount between 0 and 10 seconds
	err := restate.Sleep(ctx, time.Duration(rand.Intn(5))*time.Second)
	if err != nil {
		return SubTaskResult{}, err
	}
	log.Printf("Execution subtask finished: %s\n", subtask.Description)
	return SubTaskResult{Description: subtask.Description + ": DONE"}, nil
}

func aggregate(subResults []SubTaskResult) (Result, error) {
	// Aggregate the results
	descriptions := make([]string, 0, len(subResults))
	for _, subResult := range subResults {
		descriptions = append(descriptions, subResult.Description)
	}
	resultDescription := strings.Join(descriptions, ",")
	log.Printf("Aggregated result: %s\n", resultDescription)
	return Result{Description: resultDescription}, nil
}
