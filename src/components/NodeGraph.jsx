import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import NodeTooltip from "./NodeTooltip";
import CalculateCompositeScore from "./CalculateCompositeScore";

function NodeGraph({
  data,
  repel,
  attract,
  colorAttribute,
  minNodeSize,
  maxNodeSize,
  filters,
}) {
  const svgRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const minRadius = minNodeSize;
  const maxRadius = maxNodeSize;
  const repelForce = repel;
  const attractForce = attract;

  useEffect(() => {
    if (!data) return;

    let currentSelectedNode = null;

    const { width, height } = svgRef.current.getBoundingClientRect();

    d3.select(svgRef.current).selectAll("*").remove();

    const links = data.links.map((d) => ({ ...d }));
    const nodes = data.nodes.map((d) => ({ ...d }));

    const connectionCount = {};
    links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;
      connectionCount[sourceId] = (connectionCount[sourceId] || 0) + 1;
      connectionCount[targetId] = (connectionCount[targetId] || 0) + 1;
    });
    nodes.forEach((node) => {
      node.connections = connectionCount[node.id] || 0;
    });

    const radiusScale = d3
      .scaleLinear()
      .domain(d3.extent(nodes, (d) => d.connections))
      .range([minRadius, maxRadius]);

    const getValidValues = (d) => {
      const val =
        colorAttribute === "compositescore"
          ? CalculateCompositeScore(d, filters)
          : d[colorAttribute];
      if (val == null) return [];
      const vals = Array.isArray(val) ? val : [val];
      return vals.filter((v) => v != null && v !== "NA" && v !== "");
    };

    const uniqueVals = Array.from(
      new Set(
        nodes
          .filter((d) => d.group === "film")
          .flatMap((d) => getValidValues(d)),
      ),
    ).sort();

    const isLog = ["budget", "grossusa", "openingusa", "grossworld"].includes(
      colorAttribute,
    );

    const isNumeric = uniqueVals.every((v) => Number.isFinite(Number(v)));

    const colorScale = isNumeric
      ? isLog
        ? d3
            .scaleSequentialSqrt(d3.interpolateTurbo)
            .domain(d3.extent(uniqueVals, Number).reverse())
        : d3
            .scaleSequential(d3.interpolateTurbo)
            .domain(d3.extent(uniqueVals, Number).reverse())
      : d3
          .scaleOrdinal()
          .domain(uniqueVals)
          .range(
            uniqueVals.map((_, i) =>
              d3.interpolateRainbow(
                uniqueVals.length === 1 ? 0.5 : i / uniqueVals.length,
              ),
            ),
          );

    const arc = d3.arc().innerRadius(0);
    const pie = d3
      .pie()
      .value(() => 1)
      .sort(null);

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`);

    const graph = svg.append("g");

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        graph.attr("transform", event.transform);
      });

    svg.call(zoom);
    svg.on("dblclick.zoom", null);

    svg.on("click", () => {
      setSelectedNode(null);
      currentSelectedNode = null;
      node.each(function (d) {
        const r = radiusScale(d.connections);
        arc.outerRadius(r);
        d3.select(this)
          .selectAll("circle")
          .transition()
          .duration(200)
          .attr("r", r);
        d3.select(this)
          .selectAll("path")
          .transition()
          .duration(200)
          .attr("d", arc);
      });
      link.transition().duration(200).attr("stroke", "#999");
    });

    const simulation = d3
      .forceSimulation(nodes)
      .alphaDecay(0.05)
      .force(
        "charge",
        d3
          .forceManyBody()
          .strength((d) => -200 - d.connections * repelForce)
          .distanceMax(500),
      )
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.2))
      .force(
        "collision",
        d3.forceCollide((d) => radiusScale(d.connections) + attractForce),
      )
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(150),
      );

    const link = graph
      .append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1)
      .attr("stroke", (d) => {
        if (!selectedNode) return "#999";
        return d.source.id === selectedNode.id ? "yellow" : "#999";
      });
    const node = graph
      .append("g")
      .attr("stroke", "#ffffff05")
      .attr("stroke-width", 1.5)
      .selectAll("g.node-group")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .each(function (d) {
        const group = d3.select(this);
        const r = radiusScale(d.connections);

        if (colorAttribute === "default") {
          group
            .append("circle")
            .attr("r", r)
            .attr("fill", d.group === "festival" ? "#dd6363" : "#56a4e4");
          return;
        }

        if (d.group === "festival") {
          group.append("circle").attr("r", r).attr("fill", "white");
          return;
        }

        let vals = getValidValues(d);

        if (vals.length === 0) {
          group.append("circle").attr("r", r).attr("fill", "#444444");
        } else if (vals.length === 1) {
          group
            .append("circle")
            .attr("r", r)
            .attr("fill", colorScale(vals[0]) || "#444444");
        } else {
          arc.outerRadius(r);
          group
            .selectAll("path")
            .data(pie(vals))
            .join("path")
            .attr("d", arc)
            .attr("fill", (p) => colorScale(p.data) || "#444444");
        }
      })
      .on("mouseover", function (event, d) {
        setHoveredNode(d);
        const r = radiusScale(d.connections) * 1.2;
        arc.outerRadius(r);
        d3.select(this)
          .selectAll("circle")
          .transition()
          .duration(200)
          .attr("r", r);
        d3.select(this)
          .selectAll("path")
          .transition()
          .duration(200)
          .attr("d", arc);
      })
      .on("mouseout", function (event, d) {
        setHoveredNode(null);

        if (currentSelectedNode !== d) {
          const r = radiusScale(d.connections);
          arc.outerRadius(r);
          d3.select(this)
            .selectAll("circle")
            .transition()
            .duration(200)
            .attr("r", r);
          d3.select(this)
            .selectAll("path")
            .transition()
            .duration(200)
            .attr("d", arc);
        }
      })
      .on("click", function (event, d) {
        event.stopPropagation();

        currentSelectedNode = d;
        setSelectedNode(d);

        node.each(function (nodeData) {
          const r =
            nodeData.id === d.id
              ? radiusScale(nodeData.connections) * 1.2
              : radiusScale(nodeData.connections);
          arc.outerRadius(r);
          d3.select(this)
            .selectAll("circle")
            .transition()
            .duration(200)
            .attr("r", r);
          d3.select(this)
            .selectAll("path")
            .transition()
            .duration(200)
            .attr("d", arc);
        });

        link
          .transition()
          .duration(200)
          .attr("stroke", (l) =>
            l.source.id === d.id || l.target.id === d.id ? "yellow" : "#999",
          );
      });

    node.append("title").text((d) => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    setTimeout(() => simulation.stop(), 10000);

    return () => simulation.stop();
  }, [data, colorAttribute]);

  return (
    <div className="graph-container">
      <NodeTooltip node={selectedNode} filters={filters} />
      <svg ref={svgRef} className="nodegraph"></svg>
    </div>
  );
}

export default NodeGraph;
