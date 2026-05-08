"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { ClusterNode, ClusterLink } from "../hooks/useAnalysis";

interface MarketMapProps {
  nodes?: ClusterNode[];
  links?: ClusterLink[];
}

export default function MarketMap({ nodes = [], links = [] }: MarketMapProps) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = 800;
    const height = 600;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    // Clonamos datos para D3
    const d3Nodes = nodes.map(d => ({ ...d })) as any[];
    const d3Links = links.map(d => ({ ...d })) as any[];

    const simulation = d3
      .forceSimulation(d3Nodes)
      .force(
        "link",
        d3.forceLink(d3Links).id((d: any) => d.id).distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append("g")
      .selectAll("line")
      .data(d3Links)
      .enter()
      .append("line")
      .attr("stroke", "#475569")
      .attr("stroke-width", (d) => Math.max(1, Math.sqrt(d.value)));

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(d3Nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => d.group === 0 ? "#8b5cf6" : d.group === 1 ? "#ef4444" : d.group === 2 ? "#eab308" : "#3b82f6")
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // Añadir etiquetas a los nodos
    const label = svg
      .append("g")
      .selectAll("text")
      .data(d3Nodes)
      .enter()
      .append("text")
      .text((d) => d.name)
      .attr("font-size", (d) => d.group === 0 ? "16px" : "12px")
      .attr("fill", "#e2e8f0")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => d.radius + 15);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    // Funciones para arrastrar nodos
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

  }, [nodes, links]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className="w-full h-[400px] bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-center">
        <p className="text-slate-500">El mapa se generará tras el análisis</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-2xl overflow-hidden">
      <svg ref={svgRef} className="w-full h-[600px]"></svg>
    </div>
  );
}
