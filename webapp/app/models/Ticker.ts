export class TickerData {
  Date: string;
  Open: number;
  Close: number;
  Low: number;
  High: number;

  constructor(Date: string, Open: number, Close: number, Low: number, High: number) {
    this.Date = Date;
    this.Open = Open;
    this.Close = Close;
    this.Low = Low;
    this.High = High;
  }
}