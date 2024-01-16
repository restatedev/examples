import { IUser } from 'models';

const {
  uniqueNamesGenerator,
  names,
  NumberDictionary,
} = require('unique-names-generator');
const { v4: uuidv4 } = require('uuid');

export const whoami = async (): Promise<IUser> => {
  const nums = NumberDictionary.generate({ min: 100, max: 999 });
  const id = uniqueNamesGenerator({ dictionaries: [names, nums] });
  const profile = {
    user_id: id,
    user_full_name: id,
    payment_method_identifier: `${uuidv4()}`,
    shipping_address: '21 jmp street',
    email_address: `${id}@mail.com`,
  };
  const uid = uuidv4().replace(/\W/g, '');

  const iuserprofile = <IUser>{
    user_id: id,
    user_full_name: id,
    payment_method_identifier: `${uuidv4()}`,
    shipping_address: '21 jmp street',
    email_address: `${id}@mail.com`,
    shopping_cart_id: uid,
  };

  return iuserprofile;
};
