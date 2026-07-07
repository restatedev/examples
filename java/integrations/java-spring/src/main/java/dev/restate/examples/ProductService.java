package dev.restate.examples;

import dev.restate.examples.model.Product;
import dev.restate.examples.repository.ProductRepository;
import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.springboot.RestateComponent;

@RestateComponent
@VirtualObject
public class ProductService {

  private final ProductRepository productRepository;

  public ProductService(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  @Handler
  public Product getProductInformation() {
    return Restate.run(
        "getProduct",
        Product.class,
        () ->
            productRepository
                .findById(Restate.key())
                .orElseThrow(() -> new TerminalException("Product does not exist")));
  }

  @Handler
  public boolean reserve() {
    String productId = Restate.key();

    Product product =
        Restate.run(
            "getProduct",
            Product.class,
            () ->
                productRepository
                    .findById(productId)
                    .orElseThrow(() -> new TerminalException("Product does not exist")));

    if (product.getQuantity() == 0) {
      return false;
    }

    Restate.run(
        "updateQuantity",
        () -> productRepository.updateQuantity(productId, product.getQuantity() - 1));
    return true;
  }

  @Handler
  public void release() {
    String productId = Restate.key();
    Product product =
        Restate.run(
            "getProduct",
            Product.class,
            () ->
                productRepository
                    .findById(productId)
                    .orElseThrow(() -> new TerminalException("Product does not exist")));

    Restate.run(
        "updateQuantity",
        () -> productRepository.updateQuantity(productId, product.getQuantity() + 1));
  }
}
