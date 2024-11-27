// Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
//
// This file is part of the Restate examples,
// which is released under the MIT license.
//
// You can find a copy of the license in the file LICENSE
// in the root directory of this repository or package or at
// https://github.com/restatedev/examples/
use restate_sdk::errors::HandlerError;
use std::sync::atomic::{AtomicI32, Ordering};
use std::sync::Arc;

pub struct PaymentClient {
    attempts: Arc<AtomicI32>,
}

impl PaymentClient {
    pub fn new() -> Self {
        PaymentClient {
            attempts: Arc::new(AtomicI32::new(0)),
        }
    }

    pub async fn call(&self, idempotency_key: &str, amount: f64) -> Result<bool, HandlerError> {
        println!(
            "Payment call succeeded for idempotency key {} and amount {}",
            idempotency_key, amount
        );
        // do the call
        Ok(true)
    }

    pub async fn failing_call(
        &self,
        idempotency_key: &str,
        amount: f64,
    ) -> Result<bool, HandlerError> {
        let attempt = self.attempts.load(Ordering::SeqCst);
        if attempt >= 2 {
            println!(
                "Payment call succeeded for idempotency key {} and amount {}",
                idempotency_key, amount
            );
            self.attempts.store(0, Ordering::SeqCst);
            Ok(true)
        } else {
            println!(
                "Payment call failed for idempotency key {} and amount {}. Retrying...",
                idempotency_key, amount
            );
            self.attempts.store(attempt + 1, Ordering::SeqCst);
            Err(HandlerError::from("Payment call failed".to_string()))
        }
    }
}

impl Default for PaymentClient {
    fn default() -> Self {
        Self::new()
    }
}
