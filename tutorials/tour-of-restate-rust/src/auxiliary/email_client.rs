// Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
//
// This file is part of the Restate examples,
// which is released under the MIT license.
//
// You can find a copy of the license in the file LICENSE
// in the root directory of this repository or package or at
// https://github.com/restatedev/examples/
use std::sync::Arc;
use std::sync::atomic::{AtomicI32, Ordering};

pub struct EmailClient;

impl EmailClient {
    pub fn new() -> Self {
        EmailClient
    }

    pub async fn notify_user_of_payment_success(&self, user_id: &str) -> bool {
        println!("Notifying user {} of payment success", user_id);
        // send the email
        true
    }

    pub async fn notify_user_of_payment_failure(&self, user_id: &str) -> bool {
        println!("Notifying user {} of payment failure", user_id);
        // send the email
        false
    }
}