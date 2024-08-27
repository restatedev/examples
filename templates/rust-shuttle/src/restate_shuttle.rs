use hyper::server::conn::http1;
use hyper_util::rt::TokioIo;
use restate_sdk::hyper::HyperEndpoint;
use restate_sdk::prelude::Endpoint;
use shuttle_runtime::{CustomError, Error};
use std::net::SocketAddr;
use std::time::Duration;
use tokio::net::TcpListener;
use tracing::{info, warn};

pub struct RestateShuttleEndpoint(Endpoint);

impl RestateShuttleEndpoint {
    pub fn new(endpoint: Endpoint) -> RestateShuttleEndpoint {
        Self(endpoint)
    }
}

#[shuttle_runtime::async_trait]
impl shuttle_runtime::Service for RestateShuttleEndpoint {
    /// Takes the service that is returned by the user in their [shuttle_runtime::main] function
    /// and binds to an address passed in by shuttle.
    async fn bind(mut self, addr: SocketAddr) -> Result<(), Error> {
        let listener = TcpListener::bind(addr).await.map_err(CustomError::new)?;

        let endpoint = HyperEndpoint::new(self.0);
        let graceful = hyper_util::server::graceful::GracefulShutdown::new();

        // when this signal completes, start shutdown
        let mut signal = std::pin::pin!(tokio::signal::ctrl_c());

        info!("Starting listening on {}", listener.local_addr().unwrap());

        // Our server accept loop
        loop {
            tokio::select! {
                Ok((stream, remote)) = listener.accept() => {
                    let endpoint = endpoint.clone();

                    let conn = http1::Builder::new().serve_connection(TokioIo::new(stream), endpoint);

                    let fut = graceful.watch(conn);

                    tokio::spawn(async move {
                        if let Err(e) = fut.await {
                            warn!("Error serving connection {remote}: {:?}", e);
                        }
                    });
                },
                _ = &mut signal => {
                    info!("Shutting down");
                    // stop the accept loop
                    break;
                }
            }
        }

        // Wait graceful shutdown
        tokio::select! {
            _ = graceful.shutdown() => {},
            _ = tokio::time::sleep(Duration::from_secs(10)) => {
                warn!("Timed out waiting for all connections to close");
            }
        }

        Ok(())
    }
}
