import { IUser } from 'models';
import { grpc } from './grpc';

const { uniqueNamesGenerator,names, NumberDictionary } = require('unique-names-generator');
const {v4 : uuidv4} = require('uuid');

export const whoami = async (): Promise<IUser> => {

	const nums = NumberDictionary.generate({ min: 100, max: 999 });
	const id = uniqueNamesGenerator({ dictionaries: [names, nums]});
	const profile = {
		user_id: id, 
		user_full_name: id,
		payment_method_identifier: `${uuidv4()}`, 
		shipping_address:  "21 jmp street",
		email_address: `${id}@mail.com`
	};
	await grpc('UserProfileService','CreateUserProfile', {user_id : id, user_profile : profile });
	//
	// generate a new shopping cart id for that user
	//
	const uid = uuidv4();

	await grpc('ShoppingCartService', 'CreateCart', {shopping_cart_id : uid, user_id: id});

	const iuserprofile = <IUser>{
		user_id: id, 
		user_full_name: id,
		payment_method_identifier: `${uuidv4()}`, 
		shipping_address:  "21 jmp street",
		email_address: `${id}@mail.com`,
    shopping_cart_id: uid
	};

  return iuserprofile;
};
