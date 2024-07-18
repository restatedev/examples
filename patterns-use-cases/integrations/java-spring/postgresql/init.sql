CREATE TABLE product (
id VARCHAR(255) PRIMARY KEY,
quantity INT NOT NULL,
price_in_cents NUMERIC NOT NULL
);
INSERT INTO product (id, quantity, price_in_cents) VALUES ('product1', 100, 1999);
INSERT INTO product (id, quantity, price_in_cents) VALUES ('product2', 200, 2999);
INSERT INTO product (id, quantity, price_in_cents) VALUES ('product3', 150, 3999);