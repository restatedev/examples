import * as restate from "@restatedev/restate-sdk";
import { TaskSpec } from "../taskmanager";
import { getBestQuote, OfferPrice, RoundtripRouteDetails } from "../util/flight_price_api";
import { checkField, parseCurrency } from "../util/utils";

// ----------------------------------------------------------------------------
//  The task workflow for periodically checking the flight prices
//  until a cheap enough offer was found
// ----------------------------------------------------------------------------

// Check prices every 10 sec. to make this more interactive
// A real setup would prob. poll every 6 hours or so
const POLL_INTERVAL = { seconds: 10 };

type FlightPriceOpts = {
  name: string;
  trip: RoundtripRouteDetails;
  priceThresholdUsd: number;
  description?: string;
};

const flightPriceWatcherWorkflow = restate.workflow({
  name: "flightPriceWatcherWorkflow",
  handlers: {
    run: async (ctx: restate.WorkflowContext, opts: FlightPriceOpts) => {
      const cancelled = ctx.promise<boolean>("cancelled");
      let attempt = 0;

      while (!(await cancelled.peek())) {
        const bestOfferSoFar = await ctx.run("Probing prices #" + attempt++, () =>
          getBestQuote(opts.trip, opts.priceThresholdUsd),
        );

        if (bestOfferSoFar.price <= opts.priceThresholdUsd) {
          return `Found an offer matching the price for '${opts.name}':\n${JSON.stringify(bestOfferSoFar, null, 2)}`;
        }

        ctx.set("last_quote", bestOfferSoFar);

        await ctx.sleep(POLL_INTERVAL);
      }

      return "(cancelled)";
    },

    cancel: async (ctx: restate.WorkflowSharedContext) => {
      ctx.promise<boolean>("cancelled").resolve(true);
    },

    currentStatus: async (ctx: restate.WorkflowSharedContext) => {
      return ctx.get<OfferPrice>("last_quote");
    },
  },
});

function paramsParser(name: string, params: any): FlightPriceOpts {
  const description = typeof params.description === "string" ? params.description : undefined;

  const priceThresholdUsd = parseCurrency(checkField<string>(params, "price_threshold"));

  const trip: RoundtripRouteDetails = {
    start: checkField<string>(params, "start_airport"),
    destination: checkField<string>(params, "destination_airport"),
    outboundDate: checkField<string>(params, "outbound_date"),
    returnDate: checkField<string>(params, "return_date"),
    travelClass: checkField<string>(params, "travel_class"),
  };

  return { name, description, trip, priceThresholdUsd };
}

export const flightPricesTaskDefinition: TaskSpec<FlightPriceOpts> = {
  paramsParser,
  taskTypeName: "flight_price",
  taskWorkflow: flightPriceWatcherWorkflow,
};

if (require.main === module) {
  restate.endpoint().bind(flightPriceWatcherWorkflow).listen(9082);
}
