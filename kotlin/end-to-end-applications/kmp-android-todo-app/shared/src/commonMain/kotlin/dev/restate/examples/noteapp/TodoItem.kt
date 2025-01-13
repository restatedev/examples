package dev.restate.examples.noteapp;

import kotlinx.serialization.Serializable
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@Serializable
@OptIn(ExperimentalUuidApi::class)
data class TodoItem(val id: String = Uuid.random().toString(), val content: String, val isCompleted: Boolean = false)