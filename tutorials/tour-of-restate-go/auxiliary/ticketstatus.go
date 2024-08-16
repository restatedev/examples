package auxiliary

type TicketStatus int

const (
	TicketStatusAvailable TicketStatus = iota
	TicketStatusReserved
	TicketStatusSold
)
