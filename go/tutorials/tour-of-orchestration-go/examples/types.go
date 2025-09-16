package examples

type PurchaseTicketRequest struct {
	TicketId      string  `json:"ticketId"`
	ConcertDate   string  `json:"concertDate"`
	Price         float64 `json:"price"`
	CustomerEmail string  `json:"customerEmail"`
}

type SubscriptionRequest struct {
	UserId        string   `json:"userId"`
	CreditCard    string   `json:"creditCard"`
	Subscriptions []string `json:"subscriptions"`
}

type SubscriptionResult struct {
	Success    bool   `json:"success"`
	PaymentRef string `json:"paymentRef"`
}

type PaymentRequest struct {
	Amount     int    `json:"amount"`
	Currency   string `json:"currency"`
	CustomerId string `json:"customerId"`
	OrderId    string `json:"orderId"`
}

type PaymentResult struct {
	Success       bool   `json:"success"`
	TransactionId string `json:"transactionId,omitempty"`
	ErrorMessage  string `json:"errorMessage,omitempty"`
}

type ConfirmationRequest struct {
	Id     string        `json:"id"`
	Result PaymentResult `json:"result"`
}
