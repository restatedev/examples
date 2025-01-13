package dev.restate.examples.noteapp

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.statement.bodyAsText
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsChannel
import io.ktor.client.statement.discardRemaining
import io.ktor.http.ContentType
import io.ktor.http.URLProtocol
import io.ktor.http.Url
import io.ktor.http.contentType
import io.ktor.http.path
import io.ktor.serialization.kotlinx.json.*

class TodosClient(baseUrl: Url) {
  private val client = HttpClient {
    install(ContentNegotiation) {
      json()

      // Strings should be serialized as json
      removeIgnoredType<String>()
    }
    defaultRequest {
      url {
        protocol = baseUrl.protocol
        host = baseUrl.host
        port = baseUrl.port
        path("Todos/my-todo/")
      }
    }
    expectSuccess = true
  }

  suspend fun readAll(): List<TodoItem> = client
    .get("readAll")
    .body()

  suspend fun add(item: TodoItem): Unit = client
    .post("add") {
      contentType(ContentType.Application.Json)
      setBody(item)
    }
    .discardRemaining()

  suspend fun markCompleted(id: String): Unit = client
    .post("markCompleted") {
      contentType(ContentType.Application.Json)
      setBody(id)
    }
    .discardRemaining()

  suspend fun remove(id: String): Unit = client
    .post("remove") {
      contentType(ContentType.Application.Json)
      setBody(id)
    }
    .discardRemaining()
}