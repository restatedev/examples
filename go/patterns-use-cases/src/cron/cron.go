package main

import (
	"fmt"
	"time"

	restate "github.com/restatedev/sdk-go"
	"github.com/robfig/cron/v3"
)

// JobRequest represents the structure for creating a cron job
type JobRequest struct {
	CronExpression string `json:"cronExpression"` // The cron expression e.g. "0 0 * * *" (every day at midnight)
	Service        string `json:"service"`
	Method         string `json:"method"`            // Handler to execute with this schedule
	Key            string `json:"key,omitempty"`     // Optional: Virtual Object key to call
	Payload        string `json:"payload,omitempty"` // Optional payload to pass to the handler
}

// JobInfo represents the stored job information
type JobInfo struct {
	Req               JobRequest `json:"req"`
	NextExecutionTime time.Time  `json:"next_execution_time"`
	NextExecutionID   string     `json:"next_execution_id"`
}

const JOB_KEY = "job" // Key for storing job information in the Restate object

// CronJobInitiator service for creating new cron jobs
//
// A distributed cron service built with Restate that schedules tasks based on cron expressions.
//
// Features:
// - Create cron jobs with standard cron expressions (e.g., "0 0 * * *" for daily at midnight)
// - Schedule any Restate service handler or virtual object method
// - Guaranteed execution with Restate's durability
// - Cancel and inspect running jobs
//
// Usage:
// 1. Send requests to CronJobInitiator.Create() to start new jobs
// 2. Each job gets a unique ID and runs as a CronJob virtual object
// 3. Jobs automatically reschedule themselves after each execution

type CronJobInitiator struct{}

func (CronJobInitiator) Create(ctx restate.Context, req JobRequest) (string, error) {
	jobID := restate.Rand(ctx).UUID().String()

	fmt.Printf("Creating new cron job with ID:", jobID, "for service:", req.Service, "method:", req.Method)
	job, err := restate.Object[*JobInfo](ctx, "CronJob", jobID, "Initiate").Request(req)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("Job created with ID %s and next execution time %s",
		jobID, job.NextExecutionTime.Format(time.RFC3339)), nil
}

type CronJob struct{}

func (CronJob) Initiate(ctx restate.ObjectContext, req JobRequest) (*JobInfo, error) {
	// Check if job already exists
	job, err := restate.Get[*JobInfo](ctx, JOB_KEY)
	if err != nil {
		return nil, err
	}
	if job != nil {
		return nil, restate.TerminalErrorf("job already exists for this ID", 500)
	}

	return scheduleNextExecution(ctx, req)
}

func (CronJob) Execute(ctx restate.ObjectContext, req JobRequest) error {
	// Get the job information
	job, err := restate.Get[*JobInfo](ctx, JOB_KEY)
	if err != nil {
		return err
	}
	if job == nil {
		return restate.TerminalErrorf("job not found", 500)
	}

	// Add key if it's a virtual object call
	fmt.Printf("Executing job with ID:", restate.Key(ctx), "for service:", req.Service, "method:", req.Method)
	if req.Key != "" {
		restate.ObjectSend(ctx, req.Service, req.Key, req.Method).Send(req.Payload)
	} else {
		restate.ServiceSend(ctx, req.Service, req.Method).Send(req.Payload)
	}

	// Schedule the next execution
	_, err = scheduleNextExecution(ctx, job.Req)
	return err
}

func (CronJob) Cancel(ctx restate.ObjectContext) error {
	// Get the job to cancel the next execution
	job, err := restate.Get[*JobInfo](ctx, JOB_KEY)
	if err != nil {
		return err
	}
	if job == nil {
		return restate.TerminalErrorf("job not found for cancellation", 404)
	}
	restate.CancelInvocation(ctx, job.NextExecutionID)
	restate.ObjectSend(ctx, "CronJob", restate.Key(ctx), "Cleanup").Send(nil)

	restate.ClearAll(ctx)
	return nil
}

func (CronJob) GetInfo(ctx restate.ObjectSharedContext) (*JobInfo, error) {
	return restate.Get[*JobInfo](ctx, JOB_KEY)
}

// scheduleNextExecution calculates and schedules the next execution of the cron job
func scheduleNextExecution(ctx restate.ObjectContext, req JobRequest) (*JobInfo, error) {
	// Parse cron expression
	parser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)
	schedule, err := parser.Parse(req.CronExpression)
	if err != nil {
		return nil, restate.TerminalErrorf("invalid cron expression: %v", err, 500)
	}

	// Get current time deterministically from Restate
	currentTime, _ := restate.Run(ctx, func(ctx restate.RunContext) (time.Time, error) {
		return time.Now(), nil
	})

	// Calculate next execution time
	nextTime := schedule.Next(currentTime)
	delay := nextTime.Sub(currentTime)

	// Schedule the next execution
	handle := restate.ObjectSend(ctx, "CronJob", restate.Key(ctx), "Execute").Send(req, restate.WithDelay(delay))

	// Store the job information
	job := &JobInfo{
		Req:               req,
		NextExecutionTime: nextTime,
		NextExecutionID:   handle.GetInvocationId(),
	}
	restate.Set(ctx, JOB_KEY, job)
	return job, nil
}
