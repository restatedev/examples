package client

import (
	"time"

	"github.com/restatedev/examples/go/patterns-use-cases/src/ratelimit/types"
	restate "github.com/restatedev/sdk-go"
)

type Limiter struct {
	ctx       restate.Context
	limiterID string
}

func NewLimiter(ctx restate.Context, limiterID string) *Limiter {
	return &Limiter{
		ctx:       ctx,
		limiterID: limiterID,
	}
}

func (lim *Limiter) state() (types.LimiterState, error) {
	return restate.Object[types.LimiterState](lim.ctx, "Limiter", lim.limiterID, "State").Request(restate.Void{})
}

// Limit returns the maximum overall event rate.
func (lim *Limiter) Limit() (types.Limit, error) {
	state, err := lim.state()
	if err != nil {
		return 0.0, err
	}
	return state.Limit, nil
}

// Burst returns the maximum burst size. Burst is the maximum number of tokens
// that can be consumed in a single call to Allow, Reserve, or Wait, so higher
// Burst values allow more events to happen at once.
// A zero Burst allows no events, unless limit == Inf.
func (lim *Limiter) Burst() (int, error) {
	state, err := lim.state()
	if err != nil {
		return 0, err
	}
	return state.Burst, nil
}

// Tokens returns the number of tokens available now.
func (lim *Limiter) Tokens() (float64, error) {
	return restate.Object[float64](lim.ctx, "Limiter", lim.limiterID, "Tokens").Request(restate.Void{})
}

// Allow reports whether an event may happen now.
func (lim *Limiter) Allow() (bool, error) {
	return lim.AllowN(1)
}

// AllowN reports whether n events may happen now.
// Use this method if you intend to drop / skip events that exceed the rate limit.
// Otherwise use Reserve or Wait.
func (lim *Limiter) AllowN(n int) (bool, error) {
	r, err := restate.Object[types.Reservation](lim.ctx, "Limiter", lim.limiterID, "ReserveN").Request(types.ReserveRequest{
		N:                n,
		MaxFutureReserve: 0,
	})
	if err != nil {
		return false, err
	}
	return r.Ok, nil
}

type Reservation struct {
	lim *Limiter
	r   types.Reservation
}

// Cancel indicates that the reservation holder will not perform the reserved action
// and reverses the effects of this Reservation on the rate limit as much as possible,
// considering that other reservations may have already been made.
func (r *Reservation) Cancel() {
	restate.ObjectSend(r.lim.ctx, "Limiter", r.lim.limiterID, "CancelReservation").Send(r.r)
}

// Reserve is shorthand for ReserveN(1).
func (lim *Limiter) Reserve() (*Reservation, error) {
	return lim.ReserveN(1)
}

// ReserveN returns a Reservation that indicates how long the caller must wait before n events happen.
// The Limiter takes this Reservation into account when allowing future events.
// The returned Reservation’s OK() method returns false if n exceeds the Limiter's burst size.
// Usage example:
//
//	r := lim.ReserveN(1)
//	if !r.OK() {
//	  // Not allowed to act! Did you remember to set lim.burst to be > 0 ?
//	  return
//	}
//	restate.Sleep(r.Delay())
//	Act()
//
// Use this method if you wish to wait and slow down in accordance with the rate limit without dropping events.
// If you need to respect a deadline or cancel the delay, use Wait instead.
// To drop or skip events exceeding rate limit, use Allow instead.
func (lim *Limiter) ReserveN(n int) (*Reservation, error) {
	return lim.reserveN(n, types.InfDuration)
}

func (lim *Limiter) reserveN(n int, maxFutureReserve time.Duration) (*Reservation, error) {
	r, err := restate.Object[types.Reservation](lim.ctx, "Limiter", lim.limiterID, "ReserveN").Request(types.ReserveRequest{
		N:                n,
		MaxFutureReserve: maxFutureReserve,
	})
	if err != nil {
		return nil, err
	}

	return &Reservation{
		lim: lim,
		r:   r,
	}, nil
}

// Wait is shorthand for WaitN(1, types.InfDuration).
func (lim *Limiter) Wait() (err error) {
	return lim.WaitN(1, types.InfDuration)
}

// SetLimit sets a new Limit for the limiter. The new Limit, and Burst, may be violated
// or underutilized by those which reserved (using Reserve or Wait) but did not yet act
// before SetLimit was called.
func (lim *Limiter) SetLimit(limit types.Limit) error {
	_, err := restate.Object[types.Reservation](lim.ctx, "Limiter", lim.limiterID, "SetRate").Request(types.SetRateRequest{
		Limit: &limit,
	})
	return err
}

// SetBurst sets a new burst size for the limiter.
func (lim *Limiter) SetBurst(burst int) error {
	_, err := restate.Object[types.Reservation](lim.ctx, "Limiter", lim.limiterID, "SetRate").Request(types.SetRateRequest{
		Burst: &burst,
	})
	return err
}

// SetRate is a convenience method to call both SetLimit and SetBurst atomically.
func (lim *Limiter) SetRate(limit types.Limit, burst int) error {
	_, err := restate.Object[types.Reservation](lim.ctx, "Limiter", lim.limiterID, "SetRate").Request(types.SetRateRequest{
		Limit: &limit,
		Burst: &burst,
	})
	return err
}

// WaitN blocks until lim permits n events to happen.
// It returns an error if n exceeds the Limiter's burst size, the invocation is
// canceled, or the expected wait time exceeds the maxFutureReserve
// The burst limit is ignored if the rate limit is Inf.
func (lim *Limiter) WaitN(n int, maxFutureReserve time.Duration) (err error) {
	r, err := lim.reserveN(n, maxFutureReserve)
	if err != nil {
		return err
	}

	if !r.r.Ok {
		if maxFutureReserve == types.InfDuration {
			return restate.WithErrorCode(restate.TerminalErrorf("rate: Wait(n=%d) would exceed the limiters burst", n), 429)
		} else {
			return restate.WithErrorCode(restate.TerminalErrorf("rate: Wait(n=%d) would either exceed the limiters burst or the provided maxFutureReserve", n), 429)
		}
	}

	// Wait if necessary
	delay := r.DelayFrom(r.r.CreationTime)
	if delay == 0 {
		return
	}

	if err := restate.Sleep(lim.ctx, delay); err != nil {
		// this only happens on invocation cancellation - cancel the reservation in the background
		r.Cancel()
		return err
	}

	return nil
}

// Delay is shorthand for DelayFrom(time.Now()) using a deterministic timestamp.
func (r *Reservation) Delay() time.Duration {
	t, _ := restate.Run(r.lim.ctx, func(ctx restate.RunContext) (time.Time, error) {
		return time.Now(), nil
	})
	return r.DelayFrom(t)
}

// DelayFrom returns the duration for which the reservation holder must wait
// before taking the reserved action.  Zero duration means act immediately.
// InfDuration means the limiter cannot grant the tokens requested in this
// Reservation within the maximum wait time.
func (r *Reservation) DelayFrom(t time.Time) time.Duration {
	if !r.r.Ok {
		return types.InfDuration
	}
	delay := r.r.TimeToAct.Sub(t)
	if delay < 0 {
		return 0
	}
	return delay
}
