package service

import (
	"math"
	"time"

	"github.com/restatedev/examples/go/patterns-use-cases/src/ratelimit/types"
	restate "github.com/restatedev/sdk-go"
)

type Limiter struct{}

func (Limiter) State(ctx restate.ObjectContext) (types.LimiterState, error) {
	return restate.Get[types.LimiterState](ctx, "state")
}

func (Limiter) Tokens(ctx restate.ObjectContext) (float64, error) {
	lim, err := restate.Get[types.LimiterState](ctx, "state")
	if err != nil {
		return 0.0, err
	}

	// deterministic date not needed, as there is only an output entry
	tokens := advance(&lim, time.Now())
	return tokens, nil
}

func (Limiter) ReserveN(ctx restate.ObjectContext, req types.ReserveRequest) (types.Reservation, error) {
	lim, err := restate.Get[types.LimiterState](ctx, "state")
	if err != nil {
		return types.Reservation{}, err
	}

	if lim.Limit == types.Inf {
		// deterministic date is not necessary, as this is part of a response body, which won't be replayed.
		t := time.Now()
		return types.Reservation{
			Ok:           true,
			CreationTime: t,
			Tokens:       req.N,
			TimeToAct:    t,
		}, nil
	}

	type runResult struct {
		types.LimiterState `json:"limiterState"`
		types.Reservation  `json:"reservation"`
	}

	result, err := restate.Run(ctx, func(ctx restate.RunContext) (runResult, error) {
		t := time.Now()
		tokens := advance(&lim, t)

		// Calculate the remaining number of tokens resulting from the request.
		tokens -= float64(req.N)

		// Calculate the wait duration
		var waitDuration time.Duration
		if tokens < 0 {
			waitDuration = durationFromTokens(lim.Limit, -tokens)
		}

		// Decide result
		ok := req.N <= lim.Burst && waitDuration <= req.MaxFutureReserve

		// Prepare reservation
		r := types.Reservation{
			Ok:           ok,
			CreationTime: t,
			Limit:        lim.Limit,
		}
		if ok {
			r.Tokens = req.N
			r.TimeToAct = t.Add(waitDuration)

			// Update state
			lim.Last = t
			lim.Tokens = tokens
			lim.LastEvent = r.TimeToAct
		}

		return runResult{lim, r}, nil
	})
	if err != nil {
		return types.Reservation{}, err
	}

	restate.Set(ctx, "state", result.LimiterState)

	return result.Reservation, nil
}

func (Limiter) SetRate(ctx restate.ObjectContext, req types.SetRateRequest) error {
	if req.Limit == nil && req.Burst == nil {
		return nil
	}

	lim, err := restate.Get[types.LimiterState](ctx, "state")
	if err != nil {
		return err
	}

	lim, err = restate.Run(ctx, func(ctx restate.RunContext) (types.LimiterState, error) {
		t := time.Now()
		tokens := advance(&lim, t)

		lim.Last = t
		lim.Tokens = tokens

		if req.Limit != nil {
			lim.Limit = *req.Limit
		}
		if req.Burst != nil {
			lim.Burst = *req.Burst
		}

		return lim, nil
	})
	if err != nil {
		return err
	}

	restate.Set(ctx, "state", lim)
	return nil
}

func (Limiter) CancelReservation(ctx restate.ObjectContext, r types.Reservation) error {
	lim, err := restate.Get[types.LimiterState](ctx, "state")
	if err != nil {
		return err
	}

	lim, err = restate.Run(ctx, func(ctx restate.RunContext) (types.LimiterState, error) {
		t := time.Now()

		if r.Limit == types.Inf || r.Tokens == 0 || r.TimeToAct.Before(t) {
			return lim, nil
		}

		// calculate tokens to restore
		// The duration between lim.lastEvent and r.timeToAct tells us how many tokens were reserved
		// after r was obtained. These tokens should not be restored.
		restoreTokens := float64(r.Tokens) - tokensFromDuration(r.Limit, lim.LastEvent.Sub(r.TimeToAct))
		if restoreTokens <= 0 {
			return lim, nil
		}
		// advance time to now
		tokens := advance(&lim, t)
		// calculate new number of tokens
		tokens += restoreTokens
		if burst := float64(lim.Burst); tokens > burst {
			tokens = burst
		}
		// update state
		lim.Last = t
		lim.Tokens = tokens
		if r.TimeToAct == lim.LastEvent {
			prevEvent := r.TimeToAct.Add(durationFromTokens(r.Limit, float64(-r.Tokens)))
			if !prevEvent.Before(t) {
				lim.LastEvent = prevEvent
			}
		}

		return lim, nil
	})

	restate.Set(ctx, "state", lim)

	return nil
}

func advance(lim *types.LimiterState, t time.Time) float64 {
	last := lim.Last
	if t.Before(last) {
		last = t
	}

	// Calculate the new number of tokens, due to time that passed.
	elapsed := t.Sub(last)
	delta := tokensFromDuration(lim.Limit, elapsed)
	tokens := lim.Tokens + delta
	if burst := float64(lim.Burst); tokens > burst {
		tokens = burst
	}
	return tokens
}

// durationFromTokens is a unit conversion function from the number of tokens to the duration
// of time it takes to accumulate them at a rate of limit tokens per second.
func durationFromTokens(limit types.Limit, tokens float64) time.Duration {
	if limit <= 0 {
		return types.InfDuration
	}

	duration := (tokens / float64(limit)) * float64(time.Second)

	// Cap the duration to the maximum representable int64 value, to avoid overflow.
	if duration > float64(math.MaxInt64) {
		return types.InfDuration
	}

	return time.Duration(duration)
}

// tokensFromDuration is a unit conversion function from a time duration to the number of tokens
// which could be accumulated during that duration at a rate of limit tokens per second.
func tokensFromDuration(limit types.Limit, d time.Duration) float64 {
	if limit <= 0 {
		return 0
	}
	return d.Seconds() * float64(limit)
}
