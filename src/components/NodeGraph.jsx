import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import NodeTooltip from "./NodeTooltip";
import CalculateCompositeScore from "./CalculateCompositeScore";

function roundToTwoDecimal(number) {
  return Math.round(number * 100) / 100;
}

function NodeGraph({
  data,
  repel,
  attract,
  colorAttribute,
  nodeSizeBy,
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

    const getSizeValue = (d) => {
      if (nodeSizeBy === "compositescore") {
        return CalculateCompositeScore(d, filters);
      }

      return d[nodeSizeBy];
    };

    const sizeValues = nodes
      .filter((d) => d.group === "film")
      .map(getSizeValue)
      .filter(
        (v) =>
          v != null &&
          v >= 0 &&
          v !== "NA" &&
          v !== "" &&
          Number.isFinite(Number(v)),
      )
      .map(Number);

    const isLogSize = [
      "budget",
      "grossworld",
      "grossusa",
      "openingusa",
    ].includes(nodeSizeBy);

    const sizeScale =
      sizeValues.length === 0
        ? () => minRadius
        : isLogSize
          ? d3
              .scaleSqrt()
              .domain([Math.min(...sizeValues), Math.max(...sizeValues)])
              .range([minRadius, maxRadius])
              .clamp(true)
          : d3
              .scaleLinear()
              .domain([Math.min(...sizeValues), Math.max(...sizeValues)])
              .range([minRadius, maxRadius])
              .clamp(true);

    const radiusScale = (d) => {
      const value = Number(getSizeValue(d));

      if (!Number.isFinite(value)) {
        return minRadius;
      }

      return sizeScale(value);
    };

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

    const isLogColor = [
      "budget",
      "grossworld",
      "grossusa",
      "openingusa",
    ].includes(colorAttribute);

    const isNumeric = uniqueVals.every((v) => Number.isFinite(Number(v)));

    const colorScale = isNumeric
      ? isLogColor
        ? d3
            .scaleSequentialSymlog(d3.interpolateBlues)
            .domain(d3.extent(uniqueVals, Number))
        : d3
            .scaleSequential(d3.interpolateBlues)
            .domain(d3.extent(uniqueVals, Number))
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
        const r = radiusScale(d);
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
        d3.forceCollide((d) => radiusScale(d) + attractForce),
      )
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(150),
      );

    // color gradient display logic
    const legend = svg
      .append("g")
      .attr("class", "color-legend")
      .attr("transform", "translate(20, 20)");

    const defs = svg.append("defs");

    const gradient = defs
      .append("linearGradient")
      .attr("id", "color-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    if (isNumeric) {
      const [min, max] = d3.extent(uniqueVals, Number);

      d3.range(0, 1.01, 0.1).forEach((t) => {
        const value = min + (max - min) * t;

        gradient
          .append("stop")
          .attr("offset", `${t * 100}%`)
          .attr("stop-color", colorScale(value));
      });
    } else {
      uniqueVals.forEach((value, i) => {
        const t = uniqueVals.length === 1 ? 0.5 : i / (uniqueVals.length - 1);

        gradient
          .append("stop")
          .attr("offset", `${t * 100}%`)
          .attr("stop-color", colorScale(value));
      });
    }
    if (colorAttribute !== "default") {
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 260)
        .attr("height", 30)
        .attr("fill", "url(#color-gradient)");
    }

    if (isNumeric && colorAttribute !== "default") {
      const [min, max] = d3.extent(uniqueVals, Number);

      legend
        .append("text")
        .attr("x", 0)
        .attr("y", 48)
        .attr("text-anchor", "start")
        .attr("fill", "white")
        .text((d) =>
          min >= 10000
            ? roundToTwoDecimal(min).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })
            : min <= 0
              ? 0
              : roundToTwoDecimal(min),
        );
      legend
        .append("text")
        .attr("x", 260)
        .attr("y", 48)
        .attr("text-anchor", "end")
        .attr("fill", "white")
        .text((d) =>
          max >= 10000
            ? roundToTwoDecimal(max).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })
            : max <= 0
              ? 0
              : roundToTwoDecimal(max),
        );
    }

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
        const r = radiusScale(d);

        if (colorAttribute === "default") {
          group
            .append("circle")
            .attr("r", r)
            .attr("fill", d.group === "festival" ? "#dd6363" : "#56a4e4");
          return;
        }

        if (d.group === "festival") {
          group.append("circle").attr("r", r).attr("fill", "#3f3f3f");
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
        const r = radiusScale(d) * 1.2;
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
          const r = radiusScale(d);
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
              ? radiusScale(nodeData) * 1.2
              : radiusScale(nodeData);
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

    node.append("title").text((d) => (d.title ? d.title : d.label));

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
  }, [data, colorAttribute, nodeSizeBy, minNodeSize, maxNodeSize]);

  return (
    <div className="graph-container">
      <NodeTooltip node={selectedNode} filters={filters} />
      <svg ref={svgRef} className="nodegraph"></svg>
    </div>
  );
}

export default NodeGraph;
