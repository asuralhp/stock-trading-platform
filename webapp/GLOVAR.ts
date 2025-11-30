export const MONGODB_DATABASE_ACCOUNT_DATA = 'account_data';
export const MONGODB_DATABASE_MARKET_DATA = 'market_data';


export const MONGODB_COLLECTION_USER = 'user';
export const MONGODB_COLLECTION_ACCOUNT = 'accounts';
export const MONGODB_COLLECTION_ORDER = 'orders';
export const MONGODB_COLLECTION_STOCK_PRICES = 'stock_prices';

export enum USER_STATUS {
  ACTIVE = 'active',
  DEACTIVE = 'deactive',
  DELETED = 'deleted'
}

export enum TIME_UNIT {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  MONTH = 'month',
  WEEK = "WEEK"
}


export class MODEL_User {
  constructor(
    public userUid: string,
    public username: string,
    public email: string,
    public residentId: string,
    public avatar: string | null,
    public first_name: string | null,
    public last_name: string | null,
    public password_hash: string | null,
    public phone_number: string | null,
    public date_of_birth: string | null, 
    public created_at: string,
    public last_login: string,
    public status: USER_STATUS
  ) {}
}