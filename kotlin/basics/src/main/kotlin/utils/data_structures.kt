package utils

import kotlinx.serialization.Serializable

@Serializable
data class SubscriptionRequest(val userId: String, val creditCard: String, val subscriptions: List<String>)

@Serializable
data class User(val email: String, val name: String)