export interface Stock {
    symbol: string;
}

export interface Watch {
    name: string;
    stocks: Stock[];
}

export class WatchList {
    userUid: string;
    watchlist: Watch[];

    constructor(userUid: string, watchlist: Watch[]) {
        this.userUid = userUid;
        this.watchlist = watchlist;
    }
}