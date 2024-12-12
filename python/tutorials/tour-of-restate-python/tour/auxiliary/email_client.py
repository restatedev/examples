# Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
#
# This file is part of the Restate examples,
# which is released under the MIT license.
#
# You can find a copy of the license in the file LICENSE
# in the root directory of this repository or package or at
# https://github.com/restatedev/examples/

class EmailClient:

    def notify_user_of_payment_success(self, user_id: str):
        print(f"Notifying user {user_id} of payment success")
        # send the email
        return True

    def notify_user_of_payment_failure(self, user_id: str):
        print(f"Notifying user {user_id} of payment failure")
        # send the email
        return True