
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import tickerData from "../data/ticker.json";
import { TIME_UNIT } from "@/GLOVAR"; // Adjust the import path as needed
import { TickerData } from "@/app/models/Ticker"; // Adjust the import path as needed
import { getStockTicker } from "@/app/api/stocks/[symbol]/crud"; // Adjust the import path as needed
import { time } from 'console';





const D3SCGraph: React.FC<any> = ({
  symbol,
  tickerData
}: {
  symbol: string;
  tickerData: TickerData[],
}) => {
  if (!tickerData || !Array.isArray(tickerData) || tickerData.length === 0) {
    return <div style={{ color: 'red', fontWeight: 'bold' }}>Error: no tickerData</div>;
  }
  
  const WIDTH = 1024;
  const HEIGHT = 540;
  const MARGIN = { top: 20, right: 30, bottom: 20, left: 50 };
  const SLIDER_WIDTH = WIDTH;
  const SLIDER_HEIGHT = 60;

  const TIME_UNIT_INTERVALS = {
    [TIME_UNIT.MINUTE]: d3.utcMinute,
    [TIME_UNIT.HOUR]: d3.utcHour,
    [TIME_UNIT.DAY]: d3.utcDay,
    [TIME_UNIT.WEEK]: d3.utcWeek,
    [TIME_UNIT.MONTH]: d3.utcMonth,
    // Add more if needed
  };

  const TIME_UNIT_FORMATS = {
    [TIME_UNIT.MINUTE]: d3.utcFormat("%H:%M"),
    [TIME_UNIT.HOUR]: d3.utcFormat("%H:00"),
    [TIME_UNIT.DAY]: d3.utcFormat("%b %-d"),
    [TIME_UNIT.WEEK]: d3.utcFormat("Week %U, %Y"),
    [TIME_UNIT.MONTH]: d3.utcFormat("%B %Y"),
    // Add more if needed
  };

  
  const svgGraph = useRef<SVGSVGElement | null>(null);
  const svgSlider = useRef<SVGSVGElement | null>(null);
  const [initialCoords, setInitialCoords] = useState({ x: 0, y: 0 });
  const [isMouseInSVG, setIsMouseInSVG] = useState(false);
  const [ticker, setTicker] = useState<TickerData[]>(tickerData);
  const [tickerLimit, setTickerLimit] = useState(130);
  const [tickerOffset, setTickerOffset] = useState(0);
  const [currentTimeUnit, setCurrentTimeUnit] = useState<TIME_UNIT>(TIME_UNIT.MINUTE);
  // const [brushWindow, setBrushWindow] = useState<[Number, Number] | null>([50, 100]);
  const [tracing, setTracking] = useState(false);
  const [locked, setLocked] = useState(false);
  const [triggerLocked, setTriggerLocked] = useState(false);
  // Custom label logic
  const getLabel = (date: Date) => {
    return TIME_UNIT_FORMATS[currentTimeUnit](date);
  };
  const formatValue = d3.format(".2f");
  const formatChange = ((f: (n: number) => string) => (y0: number, y1: number) => f((y1 - y0) / y0))(d3.format("+.2%"));
  
  
  // Fetch Initial Ticker Data
  useEffect(() => {
    async function fetchTicker() {
      try {
        const data = await getStockTicker(symbol, currentTimeUnit);
        setTicker(data);
      } catch (err) {
        console.error("Error fetching ticker data:", err);
        setTicker([]); // Set to empty array on error
      }
    }
    fetchTicker();
  }, [symbol, currentTimeUnit]);
  
  
  // D3 SVG Slider (timeline)
  const renderSlider = React.useCallback(() => {
    if (triggerLocked) {return;} // Prevent re-rendering if locked
    if (!ticker || ticker.length === 0) return;
    console.log('locked?',locked);
    
    if (locked) return; // Prevent re-rendering if locked

    const dates = ticker.map(d => d.Date instanceof Date ? d.Date : new Date(d.Date));
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    // X scale for slider
    const x = d3.scaleTime()
      .domain([minDate, maxDate])
      .range([MARGIN.left, SLIDER_WIDTH - MARGIN.right]);

    // Use current state for brush window (right-to-left)
    const startIdx = Math.max(0, tickerOffset);
    const endIdx = Math.max(0, tickerOffset + tickerLimit);

    // Brush extent
    const brush = d3.brushX()
      .extent([[MARGIN.left, MARGIN.top], [SLIDER_WIDTH - MARGIN.right, SLIDER_HEIGHT - MARGIN.bottom]])
      .on("start brush", () => {
        setLocked(true);
      })
      .on("end", (event) => {
        setTriggerLocked(true);
        setLocked(false);
        // If no selection (e.g. user clicks outside), restore previous brush window
        if (!event.selection) {
          // Redraw brush to previous position
          const x0 = x(dates[startIdx]);
          const x1 = x(dates[endIdx - 1]);
          if (!isNaN(x0) && !isNaN(x1)) {
            d3.select(svgSlider.current)
              .select(".slider-brush")
              .call(brush.move, [x0, x1]);
          }
          return;
        }
        const [x0, x1] = event.selection;
        // setBrushWindow([x0, x1]);
        
        const date0 = x.invert(x0);
        const date1 = x.invert(x1);

        
        let idx0 = dates.findIndex(d => d >= date0) ;
        // Find the first index strictly greater than date1 for the right edge (exclusive)
        let idx1 = dates.findIndex(d => d > date1);
        if (idx1 === -1) idx1 = dates.length;

        
        if (idx0 >= 0 && idx1 >= 0) {
          // Right-to-left: offset is idx0, limit is idx1-idx0
          const newLimit = Math.max(20, idx1 - idx0);
          const newOffset = Math.min(ticker.length  - newLimit, idx0);

          
          if (event.mode !== "drag") {
            setTickerLimit(newLimit);
          }else {
            setTickerLimit(tickerLimit);
          }
          
          if (tracing) {
            setTickerOffset(ticker.length - newLimit);
          } else {
            setTickerOffset(newOffset);
          }

          
        }
        
      }
    );
    d3.select(svgSlider.current).selectAll("*").remove();
    const svg = d3.select(svgSlider.current)
    .attr("viewBox", [0, 0, SLIDER_WIDTH, SLIDER_HEIGHT]);
    
    // Draw axis with custom label
    svg.append("g")
    .attr("transform", `translate(0,${SLIDER_HEIGHT - MARGIN.bottom})`)
    .call(
      d3.axisBottom(x)
      .ticks(6)
      .tickFormat((d: Date) => getLabel(d))
    );
    
    
    // Draw brush
    const brushG = svg.append("g")
    .attr("class", "slider-brush")
    .call(brush);

    // Only move brush if not already at the correct position
    const x0 = x(dates[startIdx]);
    let x1 = x(dates[endIdx - 1 ]) ;
    if (endIdx > ticker.length) {
      // If endIdx exceeds ticker length, use the last date
      x1 = x(dates[dates.length - 1]);
    }
    if (!isNaN(x0) && !isNaN(x1)) {
      brushG.call(brush.move, [x0, x1]);
    }
  // eslint-disable-next-line
  }, [ticker, tickerOffset, tickerLimit, locked]);
  
  // Only re-render slider once
  useEffect(() => {
    setTickerLimit(ticker.length);
    setTickerOffset(0);
    renderSlider();
  }, [currentTimeUnit]);
  
  useEffect(() => {
    renderSlider();
  }, [ticker, tickerOffset, tickerLimit, locked]);
  
  const advanceDateByTimeUnit = (lastDate: Date) => {
    const nextDate = new Date(lastDate.getTime());
    const select = document.getElementById("time-unit") as HTMLSelectElement | null;
    const currentTimeUnit = select ? select.value : TIME_UNIT.DAY;

    switch (currentTimeUnit) {
      case TIME_UNIT.MINUTE:
        nextDate.setSeconds(lastDate.getSeconds() + 1);
          break;
        case TIME_UNIT.HOUR:
          nextDate.setHours(lastDate.getHours() + 1);
          break;
        case TIME_UNIT.DAY:
          nextDate.setDate(lastDate.getDate() + 1);
          break;
        case TIME_UNIT.WEEK:
          nextDate.setDate(lastDate.getDate() + 7);
          break;
        case TIME_UNIT.MONTH:
          nextDate.setMonth(lastDate.getMonth() + 1);
          break;
        default:
          nextDate.setDate(lastDate.getDate() + 1);
          break;
      }
      return nextDate;
    }
  // Simulate new ticker data (for demo)
  const pushTicker = React.useCallback(() => {
    
    setTicker(ticker => {
      const lastDate = new Date(ticker[ticker.length - 1].Date);
      // Advance nextDate based on currentTimeUnit
      
      
      
      const nextDate = advanceDateByTimeUnit(lastDate);
      const timeUnitInterval = TIME_UNIT_INTERVALS[currentTimeUnit];

      // Generate Open and Close prices close to previous Close
      const prevClose = ticker[ticker.length - 1].Close;
      const open = prevClose + (Math.random() - 0.5) * 0.01; // small random change
      const close = open + (Math.random() - 0.5) * 0.01; // small random change from open
      const low = Math.min(open, close) - Math.random() * 0.02;
      const high = Math.max(open, close) + Math.random() * 0.02;
      const volume = Math.floor(Math.random() * 100 + 1000);

      // Helper to round to 2 decimals
      const round2 = (n: number) => Number(n.toFixed(4));
      const round0 = (n: number) => Number(n.toFixed(0));

      if (timeUnitInterval && timeUnitInterval.count(lastDate, nextDate) < 1) {
        // Remove last tick if not advanced enough in time unit
        const newTicker = [...ticker];
        let lastTick = newTicker[newTicker.length - 1];
        lastTick.Date = nextDate.toISOString();
        lastTick.Close = round2(close);
        lastTick.High = Math.max(lastTick.High, lastTick.Close);
        lastTick.Low = Math.min(lastTick.Low, lastTick.Close);
        lastTick.Volume += round0(volume);
        newTicker[newTicker.length - 1] = lastTick;
        return newTicker;
      }

      return [
        ...ticker,
        {
          Date: nextDate.toISOString(),
          Open: round2(open),
          Close: round2(close),
          Low: round2(low),
          High: round2(high),
          Volume: round0(volume),
        }
      ];
    });
  }, [currentTimeUnit]);



  useEffect(() => {
    // frequency of ticker updates
    const tickerPushInterval = setInterval(pushTicker, 100);
    return () => clearInterval(tickerPushInterval);
  }, [currentTimeUnit]);

  
  // Total Render
  useEffect(() => {
    if (!ticker || ticker.length === 0) return;
    if (tickerOffset >= ticker.length) return;
    if (triggerLocked){
      setTriggerLocked(false);
      return;
    }
    // Right-to-left: offset is from left, limit is window size
    let tickerStart = tickerOffset;
    let tickerEnd = tickerOffset + tickerLimit;
    if (tickerStart < 0) tickerStart = 0;
    if (tickerEnd > ticker.length) tickerEnd = ticker.length;
    const limitedTicker = ticker.slice(tickerStart, tickerEnd);

    // Chart setup
    d3.select(svgGraph.current).selectAll("*").remove();
    const parsedTicker = limitedTicker.map(d => ({
      Date: new Date(d.Date),
      Open: d.Open,
      Close: d.Close,
      Low: d.Low,
      High: d.High,
    }));

    // Polymorphic time unit handling
    const interval = TIME_UNIT_INTERVALS[currentTimeUnit];

    const startDate = interval.floor(parsedTicker[0].Date);
    const endDate = interval.ceil(parsedTicker[parsedTicker.length - 1].Date);
    const clampedTicker = parsedTicker.filter(d => d.Date >= startDate && d.Date <= endDate);


   
    const dates = Array.from(new Set(limitedTicker.map(d => d.Date instanceof Date ? d.Date : new Date(d.Date))));

    const x = d3.scaleBand()
      .domain(dates)
      .range([MARGIN.left, WIDTH - MARGIN.right])
      .padding(0.2);

    const y = d3.scaleLog()
      .domain([d3.min(clampedTicker, d => d.Low)!, d3.max(clampedTicker, d => d.High)!])
      .rangeRound([HEIGHT - MARGIN.bottom, MARGIN.top]);

    const svg = d3.select(svgGraph.current)
      .attr("viewBox", [0, 0, WIDTH, HEIGHT]);

    // X axes
    svg.append("g")
      .attr("transform", `translate(0,${HEIGHT - MARGIN.bottom})`)
      .call(d3.axisBottom(x)
        .tickValues(d3.range(0, parsedTicker.length, Math.floor(tickerLimit / 20) + 5)
          .map(i => dates[i])
        )
        .tickFormat((d, i) => {
          // d is the domain value (formatted date string)
          // Find the corresponding Date object
          const idx = dates.indexOf(d as string);
          if (idx >= 0 && parsedTicker[idx]) {
            return getLabel(parsedTicker[idx].Date);
          }
          return d as string;
        })
      )
      .call(g => g.select(".domain").remove());
    
    // Y axes
    svg.append("g")
      .attr("transform", `translate(${MARGIN.left - 10},0)`)
      .call(d3.axisLeft(y)
        .tickFormat(d3.format("$~f"))
        .tickValues(d3.scaleLinear().domain(y.domain()).ticks()))
      .call(g => g.select(".domain").remove());
    
    // Ticker
    const oneTicker = svg.append("g")
      .attr("stroke-linecap", "round")
      .attr("stroke", "grey")
      .selectAll("g")
      .data(clampedTicker)
      .join("g")
      .attr("transform", d => {
        const xPosition = x(d.Date instanceof Date ? d.Date : new Date(d.Date));
        return `translate(${xPosition !== undefined ? xPosition : 0},0)`;
      });
    
    // Ticker Style
    oneTicker.append("line")
      .attr("y1", d => y(d.Low))
      .attr("y2", d => y(d.High));

    oneTicker.append("line")
      .attr("y1", d => y(d.Open))
      .attr("y2", d => y(d.Close))
      .attr("stroke-width", x.bandwidth())
      .attr("stroke", d => d.Open > d.Close ? d3.schemeSet1[0]
        : d.Close > d.Open ? d3.schemeSet1[2]
          : d3.schemeSet1[8]);

    // Ticker Info
    oneTicker.append("title")
      .text(
        d => `${getLabel(d.Date)}
Open: ${formatValue(d.Open)}
Close: ${formatValue(d.Close)} (${formatChange(d.Open, d.Close)})
Low: ${formatValue(d.Low)}
High: ${formatValue(d.High)}`
      );

    // Crosshair lines and price label
    let xValue = Math.round((initialCoords.x - MARGIN.left) / x.step());
    xValue = Math.max(0, xValue);

    const verticalLine = svg.append("line")
      .attr("class", "vertical-crosshair guide-line")
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("y1", MARGIN.top)
      .attr("y2", HEIGHT - MARGIN.bottom)
      .attr("transform", `translate(${x(dates[xValue])}, 0)`)
      .style("opacity", 0)
      .style("pointer-events", "none");

    const price = y.invert(initialCoords.y);
    const horizontalLine = svg.append("line")
      .attr("class", "horizontal-crosshair guide-line")
      .attr("stroke", "blue")
      .attr("stroke-width", 1)
      .attr("x1", MARGIN.left)
      .attr("x2", WIDTH - MARGIN.right)
      .attr("transform", `translate(0, ${y(price)})`)
      .style("opacity", 0)
      .style("pointer-events", "none");

    const priceLabel = svg.append("text")
      .attr("class", "price-label guide-line")
      .attr("fill", "grey")
      .attr("font-size", "10.5px")
      .attr("x", MARGIN.left)
      .attr("dy", "-0.5em")
      .attr("y", y(price))
      .text(`Price: ${d3.format("$,.2f")(price)}`)
      .style("opacity", 0);

    if (isMouseInSVG) {
      verticalLine.style("opacity", 0.5);
      horizontalLine.style("opacity", 0.5);
      priceLabel.style("opacity", 0.5);
    }

    svg.on("mouseenter", () => setIsMouseInSVG(true));
    svg.on("mousemove", function (event) {
      const [mouseX, mouseY] = d3.pointer(event);
      setInitialCoords({ x: mouseX, y: mouseY });
      const xValue = Math.round((mouseX - MARGIN.left) / x.step());
      if (xValue >= 0 && xValue < dates.length && mouseY <= MARGIN.top && mouseY >= HEIGHT - MARGIN.bottom) {
        verticalLine.attr("transform", `translate(${x(dates[xValue])}, 0)`).style("opacity", 0.5);
        const price = y.invert(mouseY);
        horizontalLine.attr("transform", `translate(0, ${y(price)})`).style("opacity", 0.5);
        priceLabel.attr("y", y(price)).text(`Price: ${d3.format("$,.2f")(price)}`).style("opacity", 0.5);
      }
    });
    svg.on("mouseleave", function () {
      verticalLine.style("opacity", 0);
      horizontalLine.style("opacity", 0);
      priceLabel.style("opacity", 0);
      setIsMouseInSVG(false);
    });

  }, [isMouseInSVG, initialCoords, ticker, tickerLimit, tickerOffset, currentTimeUnit]);



  return (
    <>
      <input
        type="range"
        min="20"
        max="130"
        value={tickerLimit}
        onChange={e => setTickerLimit(Number(e.target.value))}
      />
      <input
        type="range"
        min="0"
        max={ticker.length}
        value={tickerOffset}
        onChange={e => setTickerOffset(Number(e.target.value))}
      />
      <div>
        <label>Time Unit: </label> 
        <select id="time-unit" value={currentTimeUnit} onChange={e => setCurrentTimeUnit(e.target.value)}>
          {/* <option value={TIME_UNIT.SECOND}>Second</option> */}
          <option value={TIME_UNIT.MINUTE}>Minute</option>
          <option value={TIME_UNIT.HOUR}>Hour</option>
          <option value={TIME_UNIT.DAY}>Day</option>
          <option value={TIME_UNIT.WEEK}>Week</option>
          <option value={TIME_UNIT.MONTH}>Month</option>
        </select>
        <p>{`Current Time Unit: ${currentTimeUnit}`}</p>
        <label>
          <input
            type="checkbox"
            checked={tracing}
            onChange={() => setTracking(tracing => !tracing)}
          />
          {tracing ? "Disable Tracing" : "Enable Tracing"}
        </label>
      </div>
      <svg ref={svgGraph}></svg>
      {/* SVG Timeline Slider */}
      <svg ref={svgSlider} style={{ display: "block", marginTop: 12 }}></svg>

    </>
  );
};

export default D3SCGraph;