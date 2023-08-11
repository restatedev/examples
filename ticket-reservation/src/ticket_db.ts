import * as restate from "@restatedev/restate-sdk";

enum TicketStatus {
  Available,
  Reserved,
  Sold,
}

const doReserveTicket = async (ctx: restate.RpcContext) => {
  const status =
    (await ctx.get<TicketStatus>("status")) || TicketStatus.Available;

  if (status === TicketStatus.Available) {
    ctx.set("status", TicketStatus.Reserved);
    return true;
  } else {
    return false;
  }
};

const doUnreserveTicket = async (ctx: restate.RpcContext) => {
  const status =
    (await ctx.get<TicketStatus>("status")) || TicketStatus.Available;

  if (status === TicketStatus.Sold) {
    return false;
  } else {
    ctx.clear("status");
    return true;
  }
};

const doMarkAsSold = async (ctx: restate.RpcContext) => {
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
  path: "TicketDb",
};
export const ticketDbRouter = restate.keyedRouter({
  reserve: doReserveTicket,
  unreserve: doUnreserveTicket,
  markAsSold: doMarkAsSold,
});
