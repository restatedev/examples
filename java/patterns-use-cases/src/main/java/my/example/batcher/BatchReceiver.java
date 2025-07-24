package my.example.batcher;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import java.util.List;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@Service
public class BatchReceiver {

  private static final Logger LOG = LogManager.getLogger(BatchReceiver.class);

  @Handler
  public void receive(Context ctx, List<String> items) {
    LOG.info("Received batch: {}", items);
  }
}
