package utils

import kotlinx.serialization.Serializable

@Serializable
data class UserRole(val roleKey: String, val roleDescription: String)

@Serializable
data class Permission(val permissionKey: String, val setting: String)

@Serializable
data class UpdateRequest(val userId: String, val role: UserRole, val permissions: List<Permission>)

@Serializable
data class User(val email: String, val name: String)

@Serializable
data class UserProfile(val id: String, val name: String, val email: String)

@Serializable
data class UserUpdate(val profile: String, val permissions: String, val resources: String)