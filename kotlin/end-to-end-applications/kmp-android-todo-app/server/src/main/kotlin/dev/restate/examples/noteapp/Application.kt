package dev.restate.examples.noteapp

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Shared
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.kotlin.endpoint.endpoint
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.common.StateKey
import dev.restate.sdk.common.TerminalException

@VirtualObject
class Todos {

    companion object {
        private val TODOS = stateKey<Map<String, TodoItem>>("todos")
    }

    @Handler
    suspend fun add(item: TodoItem) = update(TODOS) {
      (it ?: emptyMap()) + (item.id to item)
    }

    @Handler
    suspend fun markCompleted(id: String) = update(TODOS) {
       val newNote = (it ?: emptyMap())
           .getOrElse(id) { throw TerminalException(404, "Note not found for given index $id") }
           .copy(isCompleted = true)

        it!! + (newNote.id to newNote)
    }

    @Handler
    suspend fun remove(id: String) = update(TODOS) {
        val map = it?.toMutableMap() ?: mutableMapOf()
        if (map.remove(id) == null) {
            throw TerminalException(404, "Note not found for given index $id")
        }
      map
    }

    @Shared
    suspend fun readAll(): Collection<TodoItem> =
        state().get(TODOS)?.values ?: emptyList()
}

// Helper function to update state values
private suspend fun <T: Any> update(stateKey: StateKey<T>, fn: (T?) -> T) {
    val state = state()
    state.set(stateKey, fn(state.get(stateKey)))
}

fun main() {
    RestateHttpServer.listen(endpoint {
        bind(Todos())
    })
}
