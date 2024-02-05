/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  Sequelize,
} from "sequelize";

const DB_HOSTNAME = process.env.DB_HOSTNAME || "db";
export const sequelize = new Sequelize(
  `postgres://restatedb:restatedb@${DB_HOSTNAME}:5432/productsdb`
);

class Product extends Model<
  InferAttributes<Product>,
  InferCreationAttributes<Product>
> {
  declare id: string;
  declare quantity: number;
  declare priceInCents: number;
  declare availableSizes: string[];
  declare currencyFormat: string;
  declare currencyId: string;
  declare description: string;
  declare isFreeShipping: boolean;
  declare sku: number;
  declare style: string;
  declare title: string;
  declare versionTag: number;
}

Product.init(
  {
    id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    priceInCents: {
      type: DataTypes.BIGINT,
    },
    availableSizes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
    },
    currencyFormat: {
      type: DataTypes.STRING(255),
    },
    currencyId: {
      type: DataTypes.STRING(255),
    },
    description: {
      type: DataTypes.STRING(255),
    },
    isFreeShipping: {
      type: DataTypes.BOOLEAN,
    },
    sku: {
      type: DataTypes.BIGINT,
    },
    style: {
      type: DataTypes.STRING(255),
    },
    title: {
      type: DataTypes.STRING(255),
    },
    versionTag: {
      type: DataTypes.STRING(255),
    },
  },
  {
    sequelize,
    tableName: "product",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["id"],
      },
    ],
  }
);

export default Product;
