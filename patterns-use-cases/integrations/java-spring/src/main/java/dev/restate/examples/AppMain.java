package dev.restate.examples;

import dev.restate.sdk.springboot.EnableRestate;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableRestate
public class AppMain {

  public static void main(String[] args) {
    SpringApplication.run(AppMain.class, args);
  }
}
