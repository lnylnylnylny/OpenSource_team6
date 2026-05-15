// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from "react";

export function useWebSocket(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [changeRate, setChangeRate] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${window.location.protocol === "http:" ? "ws:" : "wss:"}//${import.meta.env.VITE_WS_HOST}/ws/quotes/${symbol}`,
    );
    wsRef.current = ws;

    ws.onopen = () => console.log(`WebSocket 연결: ${symbol}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.price !== undefined) {
        setPrice(data.price);
        setChangeRate(data.change_rate || 0);
        if (data.volume) setVolume(data.volume);
      }
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  return { price, changeRate, volume };
}
