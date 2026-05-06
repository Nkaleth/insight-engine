"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

// Paso 2: Datos de prueba (Nodos y Enlaces)
const MOCK_DATA = {
  nodes: [
    { id: "1", name: "Automatización", group: 1, radius: 20 },
    { id: "2", name: "SEO Local", group: 2, radius: 15 },
    { id: "3", name: "Agentes IA", group: 1, radius: 30 },
  ],
  links: [
    { source: "1", target: "3", value: 2 },
    { source: "2", target: "3", value: 1 },
  ],
};

export default function MarketMap() {
  // Paso 1: El escudo protector
  const svgRef = useRef(null); // <- HUECO 1: Hook de React para crear referencias mutables

  useEffect(() => {
    // Si la referencia no tiene un elemento HTML asignado aún, cancelamos
    if (!svgRef.current) return; // <- HUECO 2: Propiedad del ref que contiene el elemento DOM actual

    const width = 800;
    const height = 600;

    // Seleccionamos el SVG usando D3 y le damos dimensiones
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Limpieza de re-renders
    svg.selectAll("*").remove();

    // Paso 3: El Motor Físico (Force Simulation)
    // Clonamos los datos porque D3 mutará estos objetos agregándoles coordenadas (x, y)
    const nodes = MOCK_DATA.nodes.map(
      (d) => ({ ...d }) as d3.SimulationNodeDatum & typeof d,
    ); // <- HUECO 4: Propiedad del objeto MOCK_DATA que contiene los nodos
    const links = MOCK_DATA.links.map((d) => ({ ...d })); // <- HUECO 5: Propiedad del objeto MOCK_DATA que contiene los enlaces

    // Creamos la simulación de fuerzas
    const simulation = d3
      .forceSimulation(nodes) // <- HUECO 6: Método de d3 para crear una simulación (pista: forceSimulation)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300)) // Repulsión magnética entre nodos
      .force("center", d3.forceCenter(width / 2, height / 2)); // Gravedad hacia el centro

    // Paso 4: Dibujando las líneas (Enlaces)
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#475569")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    // Paso 4: Dibujando los círculos (Nodos)
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => (d.group === 1 ? "#3b82f6" : "#10b981"));

    // Cada vez que la simulación avanza un "tick" (milisegundo), actualizamos las posiciones
    simulation.on("tick", () => {
      // <- HUECO 7: Evento de la simulación (pista: tick)
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
    });
  }, []);

  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-2xl flex justify-center">
      {/* Entregamos el lienzo a D3 */}
      <svg ref={svgRef} className="w-full h-[600px]"></svg>{" "}
      {/* <- HUECO 3: Variable que creaste en el Hueco 1 */}
    </div>
  );
}
