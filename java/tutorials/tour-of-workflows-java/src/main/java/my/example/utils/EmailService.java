package my.example.utils;

import static my.example.utils.Utils.sendWelcomeEmail;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.types.EmailServiceResponse;
import my.example.types.User;

@Service
public class EmailService {
  @Handler
  public EmailServiceResponse sendWelcome(Context ctx, User user) {
    ctx.run(() -> sendWelcomeEmail(user));
    return new EmailServiceResponse(true, "Email sent successfully");
  }
}
