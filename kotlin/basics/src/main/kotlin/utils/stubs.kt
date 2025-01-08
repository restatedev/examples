package utils

import org.apache.logging.log4j.LogManager

private val logger = LogManager.getLogger("stubs")
private val killProcess: Boolean = System.getenv("CRASH_PROCESS") != null

fun maybeCrash(probability: Double) {
  if (Math.random() < probability) {
    logger.error("👻 A failure happened!")

    if (killProcess) {
      logger.error("👻 --- CRASHING THE PROCESS ---")
      System.exit(1)
    } else {
      throw RuntimeException("👻 A failure happened!")
    }
  }
}

fun createSubscription(userId: String, subscription: String, paymentRef: String): String {
  maybeCrash(0.3)
  logger.info(">>> Creating subscription {} for user {} with payment reference {}", subscription, userId, paymentRef)
  return "SUCCESS"
}

fun createRecurringPayment(creditCard: String, paymentId: String): String {
  maybeCrash(0.3)
  logger.info(">>> Creating recurring payment {}", paymentId)
  return "payment-reference"
}

fun createUserEntry(user: User) {
  logger.info(">>> Creating user entry for {}", user.name)
}

fun sendEmailWithLink(userId: String, user: User, secret: String) {
  logger.info(">>> Sending email with secret {} to user {}", secret, user.name)
  logger.info("To simulate a user clicking the link, run the following command: \n " +
          "curl localhost:8080/SignupWorkflow/{}/click -H 'content-type: application/json' -d '\"{}\"'",
    userId, secret)
}

fun chargeBankAccount(paymentDeduplicationID: String, amount: Int) {
  // Implementation here
}