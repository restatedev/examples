package utils

import kotlinx.serialization.Serializable

@Serializable
data class UserRole(val roleKey: String, val roleDescription: String)

@Serializable
data class Permission(val permissionKey: String, val setting: String)

@Serializable
data class SubscriptionRequest(val userId: String, val creditCard: String, val subscriptions: List<String>)

@Serializable
data class User(val email: String, val name: String)