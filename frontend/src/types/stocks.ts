export interface Stock {
  id: number;
  symbol: string;
  name: string;
  market?: string;
  asset_type?: string;
  last_price: number | null;
  change_rate: number | null;
  volume: number;
  prev_close?: number | null;
  market_cap?: number | null;
  is_active?: boolean;
}

export interface Quote {
  quote_time: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  change_rate?: number;
}

export interface Holding {
  stock_symbol: string;
  stock_name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  current_value: number;
  pnl: number;
  pnl_rate: number;
}

export interface Order {
  id: number;
  stock_code: string;
  side: "BUY" | "SELL";
  order_type: "LIMIT" | "MARKET";
  price?: number;
  volume: number;
  filled_volume: number;
  status: string;
  created_at: string;
}

export interface Balance {
  total_balance: number;
  cash_balance: number;
  total_pnl: number;
  total_pnl_rate: number;
}
