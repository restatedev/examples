package com.example.workflows.utils;

import static com.example.workflows.utils.Utils.sendWelcomeEmail;

import com.example.workflows.types.EmailServiceResponse;
import com.example.workflows.types.User;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;

@Service
public class EmailService {
  @Handler
  public EmailServiceResponse sendWelcome(Context ctx, User user) {
    ctx.run(() -> sendWelcomeEmail(user));
    return new EmailServiceResponse(true, "Email sent successfully");
  }
}
