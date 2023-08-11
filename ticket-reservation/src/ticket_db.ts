import * as restate from "@restatedev/restate-sdk";

enum TicketStatus {
  Available,
  Reserved,
  Sold,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const doReserveTicket = async (ctx: restate.RpcContext, ticketId: string) => {
  const status =
    (await ctx.get<TicketStatus>("status")) || TicketStatus.Available;

  if (status === TicketStatus.Available) {
    ctx.set("status", TicketStatus.Reserved);
    return true;
  } else {
    return false;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const doUnreserveTicket = async (ctx: restate.RpcContext, ticketId: string) => {
  const status =
    (await ctx.get<TicketStatus>("status")) || TicketStatus.Available;

  if (status === TicketStatus.Sold) {
    return false;
  } else {
    ctx.clear("status");
    return true;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const doMarkAsSold = async (ctx: restate.RpcContext, ticketId: string) => {
  const status =
    (await ctx.get<TicketStatus>("status")) || TicketStatus.Available;

  if (status === TicketStatus.Reserved) {
    ctx.set("status", TicketStatus.Sold);
    return true;
  } else {
    return false;
  }
};

export const ticketDbApi: restate.ServiceApi<typeof ticketDbRouter> = {
  path: "ticketDb",
};
export const ticketDbRouter = restate.keyedRouter({
  reserve: doReserveTicket,
  unreserve: doUnreserveTicket,
  markAsSold: doMarkAsSold,
});
