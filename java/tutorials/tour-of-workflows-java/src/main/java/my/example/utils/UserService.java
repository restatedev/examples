package my.example.utils;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.types.CreateUserRequest;

import static my.example.utils.Utils.createUser;

@Service
public class UserService {
  @Handler
  public Boolean createUser(Context ctx, CreateUserRequest req) {
    return ctx.run("create user", Boolean.class, () -> Utils.createUser(req.userId(), req.user()));
  }
}
