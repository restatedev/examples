import dev.restate.sdk.Context
import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.endpoint
import java.math.BigDecimal
import java.time.Duration
import java.time.Instant
import java.time.ZonedDateTime
import java.util.*

data class PurchaseTicketRequest(
    val ticketId: String,
    val concertDateTime: String,
    val price: BigDecimal,
    val customerEmail: String
)

// dayBefore calculates delay until day before concert
fun dayBefore(concertDate: String): Duration {
    return try {
        val concertDateTime = ZonedDateTime.parse(concertDate)
        val concertTimeMillis = concertDateTime.toInstant().toEpochMilli()
        val now = Instant.now().toEpochMilli()
        val oneDayMillis = 24 * 60 * 60 * 1000
        val delay = concertTimeMillis - now - oneDayMillis
        
        if (delay < 0) {
            println("Reminder date is in the past, cannot schedule reminder.")
            Duration.ofMillis(0)
        } else {
            println("Scheduling reminder for $concertDate with delay ${delay}ms")
            Duration.ofMillis(delay)
        }
    } catch (e: Exception) {
        println("Invalid date format: $concertDate")
        Duration.ofMillis(0)
    }
}

@Service
class PaymentService {
    @Handler
    suspend fun charge(ctx: Context, req: PurchaseTicketRequest): String {
        // Simulate payment processing
        val paymentId = ctx.random().nextUUID().toString()
        println("Processing payment for ticket ${req.ticketId} with payment ID $paymentId")
        return paymentId
    }
}

@Service
class EmailService {
    @Handler
    suspend fun emailTicket(ctx: Context, req: PurchaseTicketRequest) {
        println("Sending ticket to ${req.customerEmail} for concert on ${req.concertDateTime}")
    }

    @Handler
    suspend fun sendReminder(ctx: Context, req: PurchaseTicketRequest) {
        println("Sending reminder for concert on ${req.concertDateTime} to ${req.customerEmail}")
    }
}

@Service
class ConcertTicketingService {
    @Handler
    suspend fun buy(ctx: Context, req: PurchaseTicketRequest): String {
        // Request-response call - wait for payment to complete
        val payRef = PaymentServiceClient.fromContext(ctx).charge(req).await()

        // One-way message - fire and forget ticket delivery
        EmailServiceClient.fromContext(ctx).send().emailTicket(req)

        // Delayed message - schedule reminder for day before concert
        val delay = dayBefore(req.concertDateTime)
        EmailServiceClient.fromContext(ctx).send().sendReminder(req, delay)

        return "Ticket purchased successfully with payment reference: $payRef"
    }
}

fun main() {
    RestateHttpServer.listen(endpoint {
        bind(PaymentService())
        bind(EmailService())
        bind(ConcertTicketingService())
    })
}