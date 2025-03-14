package types

import (
	"math"
	"time"
)

// Limit defines the maximum frequency of some events.
// Limit is represented as number of events per second.
// A zero Limit allows no events.
type Limit float64

// Inf is the infinite rate limit; it allows all events (even if burst is zero).
const Inf = Limit(math.MaxFloat64)

// InfDuration is the duration returned by Delay when a Reservation is not OK.
const InfDuration = time.Duration(math.MaxInt64)

// A Reservation holds information about events that are permitted by a Limiter to happen after a delay.
// A Reservation may be canceled, which may enable the Limiter to permit additional events.
type Reservation struct {
	Ok           bool      `json:"ok"`
	Tokens       int       `json:"tokens"`
	CreationTime time.Time `json:"creationTime"`
	TimeToAct    time.Time `json:"timeToAct"`
	// This is the Limit at reservation time, it can change later.
	Limit Limit `json:"limit"`
}

type ReserveRequest struct {
	N                int           `json:"n"`
	MaxFutureReserve time.Duration `json:"maxFutureReserve"`
}

type SetRateRequest struct {
	Limit *Limit `json:"limit"`
	Burst *int   `json:"burst"`
}

type LimiterState struct {
	Limit  Limit   `json:"limit"`
	Burst  int     `json:"burst"`
	Tokens float64 `json:"tokens"`
	// Last is the last time the limiter's tokens field was updated
	Last time.Time `json:"last"`
	// LastEvent is the latest time of a rate-limited event (past or future)
	LastEvent time.Time `json:"lastEvent"`
}
