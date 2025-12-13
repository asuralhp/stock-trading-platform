"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

type Point = {
  timestamp: number; // epoch seconds or ms
  price: number;
};

type Props = {
  data: Point[]; // newest first or oldest first — we normalize to oldest-first
  width?: number;
  height?: number;
  color?: string;
};

export default function LiveLineChart({ data, width = 600, height = 200, color = "#2b8cbe" }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Normalize data: ensure it's oldest-first (ascending time)
    // Limit to max 30 points (latest)
    const d = [...data].slice(0, 30).reverse();

    const margin = { top: 8, right: 12, bottom: 20, left: 40 };
    const w = Math.max(100, width) - margin.left - margin.right;
    const h = Math.max(40, height) - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (d.length === 0) {
      // draw empty state
      g.append("text").attr("x", w / 2).attr("y", h / 2).attr("text-anchor", "middle").text("No data");
      return;
    }

    // convert timestamp to Date (detect seconds vs ms)
    const timestamps = d.map((p) => {
      const t = p.timestamp;
      return t > 1e12 ? new Date(t) : new Date(t * 1000);
    });

    const x = d3.scaleTime().range([0, w]).domain(d3.extent(timestamps) as [Date, Date]);
    const y = d3
      .scaleLinear()
      .range([h, 0])
      .domain([d3.min(d, (p) => p.price)! * 0.995, d3.max(d, (p) => p.price)! * 1.005]);

    // axes
    const xAxis = d3.axisBottom(x).ticks(Math.min(6, d.length)).tickFormat(d3.timeFormat("%H:%M:%S") as any);
    const yAxis = d3.axisLeft(y).ticks(4);

    g.append("g").attr("transform", `translate(0,${h})`).call(xAxis).attr("font-size", 10);
    g.append("g").call(yAxis).attr("font-size", 10);

    // line
    const line = d3
      .line<Point>()
      .x((p) => x(new Date((p.timestamp > 1e12 ? p.timestamp : p.timestamp * 1000))))
      .y((p) => y(p.price))
      .curve(d3.curveMonotoneX as any);

    g.append("path")
      .datum(d)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.6)
      .attr("d", line as any);

    // highlight latest point
    const latest = d[d.length - 1];
    if (latest) {
      const lx = x(new Date(latest.timestamp > 1e12 ? latest.timestamp : latest.timestamp * 1000));
      const ly = y(latest.price);
      g.append("circle").attr("cx", lx).attr("cy", ly).attr("r", 3.5).attr("fill", color).attr("stroke", "white");
    }

    // tooltip behavior (simple)
    const focus = g.append("g").style("display", "none");
    focus.append("rect").attr("width", 110).attr("height", 36).attr("fill", "rgba(255,255,255,0.9)").attr("stroke", "#ccc");
    const text = focus.append("text").attr("x", 6).attr("y", 16).attr("font-size", 12);

    svg
      .on("mouseover", () => focus.style("display", null))
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event as any);
        const x0 = x.invert(mx - margin.left);
        // find nearest index
        let i = d3.bisector((p: Point) => (p.timestamp > 1e12 ? p.timestamp : p.timestamp * 1000)).left(d, x0.getTime());
        i = Math.max(0, Math.min(d.length - 1, i - 1));
        const p = d[i];
        if (!p) return;
        const px = x(new Date(p.timestamp > 1e12 ? p.timestamp : p.timestamp * 1000));
        const py = y(p.price);
        focus.attr("transform", `translate(${px + margin.left + 6},${py + margin.top - 18})`);
        text.text(`${new Date(p.timestamp > 1e12 ? p.timestamp : p.timestamp * 1000).toLocaleTimeString()} ${p.price}`);
      })
      .on("mouseleave", () => focus.style("display", "none"));
  }, [data, width, height, color]);

  return <svg ref={svgRef} style={{ display: "block" }} />;
}
