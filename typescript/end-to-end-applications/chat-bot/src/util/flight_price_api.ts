export type RoundtripRouteDetails = {
    start: string,
    destination: string,
    outboundDate: string,
    returnDate: string,
    travelClass: string
}

export type OfferPrice = {
    price: number,
    currency: string,
    link: string,
    retrieved: string
}

export async function getBestQuote(trip: RoundtripRouteDetails, priceThreshold: number): Promise<OfferPrice> {

    // we want this to return a match on average every 5 tries, for the sake of of
    // using this in an interactive demo
    const price = Math.random() < 0.2
        // low prices are smidge (anywhere between 0 and 10%) below the threshold
        ? priceThreshold * (1 - (Math.random() / 10))
        // high prices are anywhere between a bit above and tripe
        : priceThreshold * (1.01 + 2 * Math.random());
    
    const roundedPrice = Math.floor(price * 100) / 100;
    
    return {
        price: roundedPrice,
        currency: "USD",
        link: "https://www.google.com/travel/flights/search?tfs=CBw[...]",
        retrieved: (new Date()).toDateString()
    }
}