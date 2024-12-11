// Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
//
// This file is part of the Restate examples,
// which is released under the MIT license.
//
// You can find a copy of the license in the file LICENSE
// in the root directory of this repository or package or at
// https://github.com/restatedev/examples/
#![allow(unused)]

use log::info;
use restate_sdk::errors::HandlerError;

pub struct EmailClient;

impl EmailClient {
    pub async fn notify_user_of_payment_success(
        user_id: &str,
    ) -> Result<bool, HandlerError> {
        info!("Notifying user {} of payment success", user_id);
        // send the email
        Ok(true)
    }

    pub async fn notify_user_of_payment_failure(
        user_id: &str,
    ) -> Result<bool, HandlerError> {
        info!("Notifying user {} of payment failure", user_id);
        // send the email
        Ok(false)
    }
}
