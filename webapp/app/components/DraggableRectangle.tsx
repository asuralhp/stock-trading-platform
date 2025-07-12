import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DraggableRectangleProps {
  onDrag: (position: { x: number, y: number }) => void;
}

const DraggableRectangle: React.FC<DraggableRectangleProps> = ({ onDrag }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rectRef = useRef<SVGRectElement | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('width', 500)
      .attr('height', 500);

    const rect = svg.append('rect')
      .attr('x', 100)
      .attr('y', 100)
      .attr('width', 100)
      .attr('height', 100)
      .attr('fill', 'blue')
      .on('click', clicked)
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded)
      );

    rectRef.current = rect.node(); // Store reference to the rectangle

    function dragStarted(event: d3.D3DragEvent<SVGRectElement, unknown, unknown>) {
      const currentX = parseFloat(d3.select(this).attr('x'));
      const currentY = parseFloat(d3.select(this).attr('y'));
      const offsetX = event.x - currentX;
      const offsetY = event.y - currentY;

      d3.select(this).raise().classed('active', true)
        .attr('data-offset-x', offsetX)
        .attr('data-offset-y', offsetY);
    }

    function dragged(event: d3.D3DragEvent<SVGRectElement, unknown, unknown>) {
      const offsetX = parseFloat(d3.select(this).attr('data-offset-x'));
      const offsetY = parseFloat(d3.select(this).attr('data-offset-y'));

      d3.select(this)
        .attr('x', event.x - offsetX)
        .attr('y', event.y - offsetY);
    }

    function dragEnded(this: SVGRectElement) {
      
      const x = parseFloat(d3.select(this).attr('x'));
      const y = parseFloat(d3.select(this).attr('y'));
      onDrag({ x, y });
      d3.select(this).classed('active', false);
    }

    function clicked(event: React.MouseEvent<SVGRectElement>) {
      const [mouseX, mouseY] = d3.pointer(event);
      const rect = d3.select(rectRef.current);
      
      const originalX = parseFloat(rect.attr('x'));
      const originalY = parseFloat(rect.attr('y'));

      // Translate the rectangle
      const translateX = mouseX - originalX;
      const translateY = mouseY - originalY;

      rect.attr('x', originalX + translateX)
          .attr('y', originalY + translateY);
    }

    return () => {
      // Cleanup if necessary
      svg.selectAll('*').remove();
    };
  }, []);

  return (
    <svg ref={svgRef}></svg>
  );
};

export default DraggableRectangle;