package my.example.schedulingtasks.utils;

record StripeData(String id, String customer) {}
public record StripeEvent(String type, long created, StripeData data) {}