package com.example.workflows.utils;

import com.example.workflows.types.CreateUserRequest;
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;

@Service
public class UserService {
  @Handler
  public Boolean createUser(Context ctx, CreateUserRequest req) {
    return true;
  }
}
