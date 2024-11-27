mod cart_object;
mod checkout_service;
mod ticket_object;

pub mod auxiliary;

use restate_sdk::prelude::*;

#[tokio::main]
async fn main() {
    // To enable logging
    tracing_subscriber::fmt::init();

    HttpServer::new(
        Endpoint::builder()
            .bind(cart_object::CartObject::serve(cart_object::CartObjectImpl))
            .bind(checkout_service::CheckoutService::serve(
                checkout_service::CheckoutServiceImpl,
            ))
            .bind(ticket_object::TicketObject::serve(
                ticket_object::TicketObjectImpl,
            ))
            .build(),
    )
    .listen_and_serve("0.0.0.0:9080".parse().unwrap())
    .await;
}
