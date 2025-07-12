export type OrderType = "limit" | "market";
export type OrderAction = "buy" | "sell";
export type OrderStatus = "pending" | "completed" | "canceled";
export type OrderSession = "regular" | "after-hours";
export type TimeInForce = "DAY" | "GTC" | "FOK" | "IOC";

export class Order {
  order_id: string;
  userUid: string;
  symbol: string;
  order_type: OrderType;
  action: OrderAction;
  amount: number;
  price: number | null;
  order_date: Date;
  trade_date?: Date | null;
  status: OrderStatus;
  session: OrderSession;
  time_in_force: TimeInForce;

  constructor(params: {
    order_id: string;
    userUid: string;
    symbol: string;
    order_type: OrderType;
    action: OrderAction;
    amount: number;
    price: number | null;
    order_date: Date;
    trade_date?: Date | null;
    status: OrderStatus;
    session: OrderSession;
    time_in_force: TimeInForce;
  }) {
    this.order_id = params.order_id;
    this.userUid = params.userUid;
    this.symbol = params.symbol;
    this.order_type = params.order_type;
    this.action = params.action;
    this.amount = params.amount;
    this.price = params.price;
    this.order_date = params.order_date;
    this.trade_date = params.trade_date ?? null;
    this.status = params.status;
    this.session = params.session;
    this.time_in_force = params.time_in_force;
  }
}