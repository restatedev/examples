import { useCartContext } from './CartContextProvider';
import { ICartDetails } from 'models';

const useCartDetails = () => {
  const { details, setDetails } = useCartContext();

  const updateCartDetails = (details: ICartDetails) => {
    setDetails(details);
  };

  return {
    details,
    updateCartDetails,
  };
};

export default useCartDetails;
