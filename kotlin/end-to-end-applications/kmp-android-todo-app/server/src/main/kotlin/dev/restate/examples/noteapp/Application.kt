package dev.restate.examples.noteapp

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Shared
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.common.StateKey
import dev.restate.sdk.common.TerminalException
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.KtStateKey
import dev.restate.sdk.kotlin.ObjectContext
import dev.restate.sdk.kotlin.SharedObjectContext

@VirtualObject
class Todos {

    companion object {
        private val TODOS = KtStateKey.json<Map<String, TodoItem>>("todos")
    }

    @Handler
    suspend fun add(ctx: ObjectContext, item: TodoItem) = ctx.update(TODOS) {
      (it ?: emptyMap()) + (item.id to item)
    }

    @Handler
    suspend fun markCompleted(ctx: ObjectContext, id: String) = ctx.update(TODOS) {
       val newNote = (it ?: emptyMap())
           .getOrElse(id) { throw TerminalException(404, "Note not found for given index $id") }
           .copy(isCompleted = true)

        it!! + (newNote.id to newNote)
    }

    @Handler
    suspend fun remove(ctx: ObjectContext, id: String) = ctx.update(TODOS) {
        val map = it?.toMutableMap() ?: mutableMapOf()
        if (map.remove(id) == null) {
            throw TerminalException(404, "Note not found for given index $id")
        }
      map
    }

    @Shared
    suspend fun readAll(ctx: SharedObjectContext): Collection<TodoItem> =
        ctx.get(TODOS)?.values ?: emptyList()
}

// Helper function to update state values
private suspend fun <T: Any> ObjectContext.update(stateKey: StateKey<T>, fn: (T?) -> T) =
    this.set(stateKey, fn(this.get(stateKey)))

fun main() {
    RestateHttpEndpointBuilder
        .builder()
        .bind(Todos())
        .buildAndListen()
}