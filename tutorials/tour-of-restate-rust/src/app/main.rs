mod cart_object;
mod checkout_service;
mod ticket_object;

use restate_sdk::prelude::*;
use crate::cart_object::CartObject;
use crate::checkout_service::CheckoutService;
use crate::ticket_object::TicketObject;

#[path="../auxiliary/mod.rs"]
mod auxiliary;

#[tokio::main]
async fn main() {
    // To enable logging
    tracing_subscriber::fmt::init();

    HttpServer::new(
        Endpoint::builder()
            .bind(cart_object::CartObjectImpl.serve())
            .bind(checkout_service::CheckoutServiceImpl.serve())
            .bind(ticket_object::TicketObjectImpl.serve())
            .build(),
    )
    .listen_and_serve("0.0.0.0:9080".parse().unwrap())
    .await;
}
