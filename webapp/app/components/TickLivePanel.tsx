"use client";

import React from "react";
import LiveLineChart from "@/app/components/D3LiveChart";
import { Tick } from "@/app/hooks/useTickSocket";

type Props = {
  latestTick: Tick | null;
  tickConnected: boolean;
  tickList: Tick[];
  chartWidth?: number;
  chartHeight?: number;
};

export function TickLivePanel({
  latestTick,
  tickConnected,
  tickList,
  chartWidth = 1024,
  chartHeight = 540,
}: Props) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
        <div style={{ fontSize: "1.1rem" }}>
          Latest Tick: {latestTick ? `${latestTick.price} (${latestTick.size})` : "—"}
        </div>
        <div style={{ fontSize: "0.9rem", color: tickConnected ? "green" : "gray" }}>
          {tickConnected ? "Live" : "Disconnected"}
        </div>
      </div>

      <div style={{ marginTop: "0.75rem", maxWidth: chartWidth }}>
        <LiveLineChart
          data={tickList.map((t) => ({ timestamp: t.timestamp, price: Number(t.price) }))}
          width={chartWidth}
          height={chartHeight}
        />
      </div>
    </div>
  );
}

export default TickLivePanel;
