import axios from 'axios';
import {grpc} from "./grpc";
import {IProduct, IProductRawInput} from "../models";

export const getProducts = async () => {
  if(process.env.REACT_APP_DATABASE_ENABLED == "true"){
    let products: IProductRawInput[] = (await grpc("ProductListingService", "ListAllProducts", {})).products;
    // We need to convert some of the fields/
    // sku: this was serialized as a string by protobuf because it was actually a long
    // price: the price needs to be converted to a decimal number
    return products.map(elem => {
      return <IProduct>{
        id: elem.id,
        sku: +elem.sku,
        title: elem.title,
        description: elem.description,
        availableSizes: elem.availableSizes,
        style: elem.style,
        price: +elem.priceInCents / 100.0,
        installments: elem.quantity,
        currencyId: elem.currencyId,
        currencyFormat: elem.currencyFormat,
        isFreeShipping: elem.isFreeShipping
      };
    });
  } else {
    let response = await axios.get('/products.json');
    const { products } = response.data.data;
    return products;
  }
};
