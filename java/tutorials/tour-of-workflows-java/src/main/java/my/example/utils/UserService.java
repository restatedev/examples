package my.example.utils;

import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.types.CreateUserRequest;

@Service
public class UserService {
  @Handler
  public Boolean createUser(CreateUserRequest req) {
    return Restate.run(
        "create user", Boolean.class, () -> Utils.createUser(req.userId(), req.user()));
  }
}
