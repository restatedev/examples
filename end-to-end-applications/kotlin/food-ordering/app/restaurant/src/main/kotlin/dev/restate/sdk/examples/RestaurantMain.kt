package dev.restate.sdk.examples

import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpHandler
import com.sun.net.httpserver.HttpServer
import dev.restate.sdk.client.Client
import dev.restate.sdk.kotlin.KtSerdes
import java.net.InetSocketAddress
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromStream
import org.apache.logging.log4j.LogManager
import org.apache.logging.log4j.Logger

/**
 * Restaurant POS system (HTTP server) that receives preparation requests for orders from the
 * OrderService. Once a preparation has been completed, it notifies the OrderService via the
 * callback.
 */
private val LOGGER: Logger = LogManager.getLogger()
private val RESTATE_RUNTIME_ENDPOINT: String =
    System.getenv("RESTATE_RUNTIME_ENDPOINT") ?: "http://localhost:8080"
private val JSON = Json { ignoreUnknownKeys = true }

fun main() {
  val server: HttpServer = HttpServer.create(InetSocketAddress(5050), 0)
  server.createContext("/prepare", PrepareHandler())
  server.setExecutor(null)
  server.start()
  LOGGER.info("Restaurant POS server is listening on port 5050...")
}

@Serializable data class Input(val orderId: String, val cb: String)

/** Preparation request handler. */
internal class PrepareHandler : HttpHandler {
  private val ingressClient: Client = Client.connect(RESTATE_RUNTIME_ENDPOINT)

  @OptIn(ExperimentalSerializationApi::class)
  override fun handle(t: HttpExchange) {
    val input = JSON.decodeFromStream<Input>(t.requestBody)

    ingressClient.awakeableHandle(input.cb).resolve(KtSerdes.UNIT, Unit)
    LOGGER.info("Order {} prepared and ready for shipping", input.orderId)

    t.sendResponseHeaders(200, -1)
  }
}
