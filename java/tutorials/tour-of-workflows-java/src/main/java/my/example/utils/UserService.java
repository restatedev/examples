package my.example.utils;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import my.example.types.CreateUserRequest;

@Service
public class UserService {
  @Handler
  public Boolean createUser(Context ctx, CreateUserRequest req) {
    return true;
  }
}
