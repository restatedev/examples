package my.example.parallelizework

import dev.restate.sdk.kotlin.Context
import kotlinx.serialization.Serializable
import org.apache.logging.log4j.LogManager
import kotlin.time.Duration.Companion.seconds

@Serializable
data class TaskResult(val description: String)

@Serializable
data class SubTask(val description: String)

@Serializable
data class Task(val description: String)

@Serializable
data class SubTaskResult(val description: String)

private val logger = LogManager.getLogger("FanOutWorker")

// Split the task into subTasks
fun Task.split() = this.description.split(",").map { SubTask(it) }

suspend fun SubTask.execute(ctx: Context): SubTaskResult {
    // Execute subtask
    logger.info("Started executing subtask: {}", this.description)
    // Sleep for a random amount between 0 and 10 seconds
    ctx.sleep(ctx.random().nextInt(0, 10).toLong().seconds)
    logger.info("Execution subtask finished: {}", this.description)
    return SubTaskResult("${this.description}: DONE")
}

fun List<SubTaskResult>.aggregate(): TaskResult {
    // Aggregate the results
    val resultDescription = this.joinToString(", ") { it.description }
    logger.info("Aggregated result: {}", resultDescription)
    return TaskResult(resultDescription)
}