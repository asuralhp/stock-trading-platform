import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import tickerData from "../data/ticker.json";


class TickerData {
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


const D3SCPOC: React.FC<TickerData[]> = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [initialCoords, setInitialCoords] = useState({ x: 0, y: 0 });
  const [isMouseInSVG, setIsMouseInSVG] = useState(false);

  const [ticker, setTicker] = useState(tickerData); // Default limit
  const [tickerLimit, setTickerLimit] = useState(130); // Default limit
  const [tickerOffset, setTickerOffset] = useState(0); // Default limit
  
  

  useEffect(() => {
    
    
    const tickerPushInterval = setInterval(() => {
      
      // test only
      setTicker(ticker => {
        const lastDate = new Date(ticker[ticker.length - 1].Date);
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + 1);
        return [...ticker, {
          Date: nextDate.toISOString().split('T')[0],
          Open: Math.random() * 10 + 170,
          Close: Math.random() * 10 + 170,
          Low: Math.random() * 10 + 170,
          High: Math.random() * 10 + 170,
          "Adj Close": Math.random() * 10 + 100,
          Volume: Math.floor(Math.random() * 100 + 1000)
        }];
      });
    }, 1000);
    
    const tickerLength = ticker.length;
    if (!ticker || tickerLength === 0) return;
    if (tickerOffset >= tickerLength) return;
    let tickerStart = tickerLength-tickerLimit-tickerOffset;
    let tickerEnd = tickerLength-tickerOffset;
    if (tickerStart < 0) {
      tickerStart = 0
      tickerEnd = tickerLimit
    }
    const limitedTicker = ticker.slice(tickerStart , tickerEnd); // Use dynamic tickerLimit

    // Chart dimensions and margins
    const width = 1024;
    const height = 540;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 20;
    const marginLeft = 50;

    // Clear previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const parsedTicker = limitedTicker.map(d => ({
      Date: new Date(d.Date),
      Open: d.Open,
      Close: d.Close,
      Low: d.Low,
      High: d.High,
    }));

    const startDate = d3.utcDay.floor(parsedTicker[0].Date);
    const endDate = d3.utcDay.ceil(parsedTicker[parsedTicker.length - 1].Date);
    const filteredTicker = parsedTicker.filter(d => d.Date >= startDate && d.Date <= endDate);

    const dates = Array.from(new Set(parsedTicker.map(d => d.Date.toISOString().split('T')[0])));
    const x = d3.scaleBand()
      .domain(dates)
      .range([marginLeft, width - marginRight])
      .padding(0.2);

    const y = d3.scaleLog()
      .domain([d3.min(filteredTicker, d => d.Low)!, d3.max(filteredTicker, d => d.High)!])
      .rangeRound([height - marginBottom, marginTop]);

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);
    
    
    
    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x)
        .tickValues(d3.range(0, parsedTicker.length, Math.floor(tickerLimit / 20) + 5)
          .map(i => dates[i])
        )
      )
      .call(g => g.select(".domain").remove());

    svg.append("g")
      .attr("transform", `translate(${marginLeft - 10},0)`)
      .call(d3.axisLeft(y)
        .tickFormat(d3.format("$~f"))
        .tickValues(d3.scaleLinear().domain(y.domain()).ticks()))
      .call(g => g.select(".domain").remove());

    const g = svg.append("g")
      .attr("stroke-linecap", "round")
      .attr("stroke", "grey")
      .selectAll("g")
      .data(filteredTicker)
      .join("g")
      .attr("transform", d => {
        const dateString = d.Date.toISOString().split('T')[0];
        const xPosition = x(dateString);
        return `translate(${xPosition !== undefined ? xPosition : 0},0)`;
      });

    g.append("line")
      .attr("y1", d => y(d.Low))
      .attr("y2", d => y(d.High));

    g.append("line")
      .attr("y1", d => y(d.Open))
      .attr("y2", d => y(d.Close))
      .attr("stroke-width", x.bandwidth())
      .attr("stroke", d => d.Open > d.Close ? d3.schemeSet1[0]
        : d.Close > d.Open ? d3.schemeSet1[2]
          : d3.schemeSet1[8]);

    const formatDate = d3.utcFormat("%B %-d, %Y");
    const formatValue = d3.format(".2f");
    const formatChange = ((f) => (y0, y1) => f((y1 - y0) / y0))(d3.format("+.2%"));

    g.append("title")
      .text(
        d => `${formatDate(d.Date)}
Open: ${formatValue(d.Open)}
Close: ${formatValue(d.Close)} (${formatChange(d.Open, d.Close)})
Low: ${formatValue(d.Low)}
High: ${formatValue(d.High)}`
    );

    // Vertical crosshair line

    
    svg.on("mouseenter", function () {
      setIsMouseInSVG(true);
    
    });
    
    
    let xValue = Math.round((initialCoords.x - marginLeft) / x.step());
    xValue = Math.max(0, xValue);
    
    const verticalLine = svg.append("line")
      .attr("class", "vertical-crosshair guide-line")
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("y1", marginTop)
      .attr("y2", height - marginBottom)
      .attr("transform", `translate(${x(dates[xValue])}, 0)`)
      .style("opacity", 0) // Initially hidden
      .style("pointer-events", "none");
      
    // Horizontal crosshair line
    
    const price = y.invert(initialCoords.y);
    const horizontalLine = svg.append("line")
      .attr("class", "horizontal-crosshair guide-line")
      .attr("stroke", "blue")
      .attr("stroke-width", 1)
      .attr("x1", marginLeft)
      .attr("x2", width - marginRight)
      .attr("transform", `translate(0, ${y(price)})`)
      .style("opacity", 0)// Initially hidden
      .style("pointer-events", "none");


    // Price label
    const priceLabel = svg.append("text")
      .attr("class", "price-label guide-line")
      .attr("fill", "grey")
      .attr("font-size", "10.5px")
      .attr("x", marginLeft)
      .attr("dy", "-0.5em") // Offset the text above the line
      .attr("y", y(price))
          .text(`Price: ${d3.format("$,.2f")(price)}`)
          .style("opacity", 0);
          
    if (isMouseInSVG) {
      verticalLine.style("opacity", 0.5); // Show vertical line
      horizontalLine.style("opacity", 0.5); // Show horizontal line
      priceLabel.style("opacity", 0.5); // Show price label
    }
    

    
         
            // Mouse event handling
      svg.on("mousemove", function (event) {
        const [mouseX, mouseY] = d3.pointer(event);
        setInitialCoords({ x:mouseX, y:mouseY });
        const xValue = Math.round((mouseX - marginLeft) / x.step());
        if (xValue >= 0 && xValue < dates.length && mouseY <= marginTop && mouseY >= height - marginBottom) {
          verticalLine.attr("transform", `translate(${x(dates[xValue])}, 0)`)
            .style("opacity", 0.5);

          // Get the corresponding price for the horizontal line
          console.log(mouseY);
          console.log(marginTop);
          
          const price = y.invert(mouseY);

          horizontalLine.attr("transform", `translate(0, ${y(price)})`)
            .style("opacity", 0.5);

          // Update the price label
          priceLabel.attr("y", y(price))
            .text(`Price: ${d3.format("$,.2f")(price)}`)
            .style("opacity", 0.5);
        }
      });
      svg.on("mouseleave", function () {
        verticalLine.style("opacity", 0); // Hide vertical line
        horizontalLine.style("opacity", 0); // Hide horizontal line
        priceLabel.style("opacity", 0); // Hide price label
        // d3.select(svgRef.current).selectAll('.guide-line')
        //   .style('opacity', 0);
        setIsMouseInSVG(false);
        console.log(isMouseInSVG);
        
      });
            

    
    
    
    
    // test only
    return () => {
      clearInterval(tickerPushInterval);
    };

  }, [isMouseInSVG, initialCoords, ticker, tickerLimit, tickerOffset]); // Add tickerLimit to the dependency array

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
      <svg ref={svgRef}></svg>
    </>
  );
};

export default D3SCPOC;