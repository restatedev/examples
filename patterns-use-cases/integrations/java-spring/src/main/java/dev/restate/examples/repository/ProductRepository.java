package dev.restate.examples.repository;

import dev.restate.examples.model.Product;
import dev.restate.sdk.common.TerminalException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
  @Modifying
  @Transactional
  @Query(
      "UPDATE Product "
          + "SET quantity = :quantity "
          + "WHERE id = :id")
  void updateQuantity(
      @Param("id") String id,
      @Param("quantity") int quantity);
}
