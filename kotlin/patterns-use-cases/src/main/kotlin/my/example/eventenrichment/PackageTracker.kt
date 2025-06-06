package my.example.eventenrichment

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Shared
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.common.TerminalException
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.kotlin.endpoint.endpoint
import kotlinx.serialization.Serializable

@Serializable
data class PackageInfo(
    val finalDestination: String,
    val locations: MutableList<LocationUpdate> = mutableListOf()
)

@Serializable data class LocationUpdate(val timestamp: String, val location: String)

@VirtualObject
class PackageTracker {

  companion object {
    private val PACKAGE_INFO = stateKey<PackageInfo>("package-info")
  }

  @Handler
  suspend fun registerPackage(ctx: ObjectContext, packageInfo: PackageInfo) {
    ctx.set(PACKAGE_INFO, packageInfo)
  }

  @Handler
  suspend fun updateLocation(ctx: ObjectContext, locationUpdate: LocationUpdate) {
    val packageInfo = ctx.get(PACKAGE_INFO) ?: throw TerminalException("Package not found")

    packageInfo.locations.add(locationUpdate)
    ctx.set(PACKAGE_INFO, packageInfo)
  }

  @Shared
  suspend fun getPackageInfo(ctx: SharedObjectContext): PackageInfo {
    return ctx.get(PACKAGE_INFO) ?: throw TerminalException("Package not found")
  }
}

fun main() {
  RestateHttpServer.listen(endpoint { bind(PackageTracker()) })
}
