package dev.restate.tour.auxiliary;

import java.util.Set;

public class CheckoutRequest {
    private String userId;
    private Set<String> tickets;

    public CheckoutRequest() {
    }

    public CheckoutRequest(String userId, Set<String> tickets) {
        this.userId = userId;
        this.tickets = tickets;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Set<String> getTickets() {
        return tickets;
    }

    public void setTickets(Set<String> tickets) {
        this.tickets = tickets;
    }
}
