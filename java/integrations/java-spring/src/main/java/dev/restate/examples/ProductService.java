package dev.restate.examples;

import dev.restate.examples.model.Product;
import dev.restate.examples.repository.ProductRepository;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.Serde;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import dev.restate.sdk.springboot.RestateVirtualObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@RestateVirtualObject
public class ProductService {

  private static final Serde<Product> productSerde = JacksonSerdes.of(Product.class);

  private final ProductRepository productRepository;

  public ProductService(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  @Handler
  public Product getProductInformation(ObjectContext ctx) {
    return ctx.run(
        productSerde,
        () ->
            productRepository
                .findById(ctx.key())
                .orElseThrow(() -> new TerminalException("Product does not exist")));
  }

  @Handler
  public boolean reserve(ObjectContext ctx) {
    String productId = ctx.key();

    Product product =
        ctx.run(
            productSerde,
            () ->
                productRepository
                    .findById(productId)
                    .orElseThrow(() -> new TerminalException("Product does not exist")));

    if (product.getQuantity() == 0) {
      return false;
    }

    ctx.run(() -> productRepository.updateQuantity(productId, product.getQuantity() - 1));
    return true;
  }

  @Handler
  public void release(ObjectContext ctx) {
    String productId = ctx.key();
    Product product =
        ctx.run(
            productSerde,
            () ->
                productRepository
                    .findById(productId)
                    .orElseThrow(() -> new TerminalException("Product does not exist")));

    ctx.run(() -> productRepository.updateQuantity(productId, product.getQuantity() + 1));
  }
}
