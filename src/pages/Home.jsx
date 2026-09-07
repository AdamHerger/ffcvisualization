import * as d3 from "d3";
import NodeGraph from "../components/NodeGraph";
import BuildGraph from "../components/buildGraph";
import { useEffect, useState } from "react";
import AttributeFilters from "../components/AttributeFilters";
import FilterFilms from "../components/FilterFilms";
import SingleRangeSlider from "../components/SingleRangeSlider";
import ColorDropdown from "../components/ColorDropdown";
import CompositeScore from "../components/CompositeScore";
function Home() {
  // for github pages deployment
  const base = import.meta.env.BASE_URL;

  const [films, setFilms] = useState([]);
  const [runs, setRuns] = useState([]);
  const [awards, setAwards] = useState([]);
  const [general, setGeneral] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [graph, setGraph] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [colorAttribute, setColorAttribute] = useState("default");

  const [filters, setFilters] = useState({
    // film filters
    ANDOR: new Map(),

    documentaryOnly: false,
    fictOnly: false,
    expOnly: false,
    animtOnly: false,
    lgbtqOnly: false,

    MENA: false,
    africa: false,
    asia: false,
    na: false,
    eu: false,
    la: false,
    ocean: false,

    minYear: 1900,
    maxYear: 2026,
    minRuntime: 0,
    maxRuntime: 1000,
    minConnections: 1,
    maxConnections: 150,
    minRating: 0,
    maxRating: 10,

    minBudget: 0,
    maxBudget: 1000000000,
    minOpeningUSA: 0,
    maxOpeningUSA: 1000000000,
    minGrossWorld: 0,
    maxGrossWorld: 1000000000,
    minGrossUSA: 0,
    maxGrossUSA: 1000000000,
    includeNA: new Map(),

    country: [],
    director: [],
    awards: [],
    languages: [],
    genres: [],

    //festival filters
    festivalCountry: [],
    festivalCity: [],
    festivalCategory: [],

    FMENA: false,
    Fafrica: false,
    Fasia: false,
    Fna: false,
    Feu: false,
    Fla: false,
    Focean: false,

    minFestivalConnections: 1,
    maxFestivalConnections: 2500,
    minFestivalYear: 1900,
    maxFestivalYear: 2026,

    compositeScore: new Map([
      [
        "year",
        {
          weight: 100,
          preference: "target",
          target: 2000,
        },
      ],
      [
        "runtime",
        {
          weight: 100,
          preference: "target",
          target: 60,
        },
      ],
      [
        "connections",
        {
          weight: 0,
          preference: "max",
          target: null,
        },
      ],
      [
        "rating",
        {
          weight: 0,
          preference: "max",
          target: null,
        },
      ],
      [
        "budget",
        {
          weight: 0,
          preference: "min",
          target: null,
        },
      ],
      [
        "openingusa",
        {
          weight: 0,
          preference: "max",
          target: null,
        },
      ],
      [
        "grossusa",
        {
          weight: 0,
          preference: "max",
          target: null,
        },
      ],
      [
        "grossworld",
        {
          weight: 0,
          preference: "max",
          target: null,
        },
      ],
    ]),
    minCompositeScore: 0,
    maxCompositeScore: 100,
    isCompositeScoreActive: false,
  });

  const [repel, setRepel] = useState(15);
  const [attract, setAttract] = useState(5);
  const [minNodeSize, setminNodeSize] = useState(6);
  const [maxNodeSize, setmaxNodeSize] = useState(15);

  useEffect(() => {
    Promise.all([
      d3.csv(`${base}dataset/1_film-dataset_festival-program_wide.csv`),
      d3.csv(`${base}dataset/3_imdb-dataset_festival-runs_long.csv`),
      d3.dsv(
        ";",
        `${base}dataset/4_festival-library_dataset_imdb-and-survey.csv`,
      ),
      d3.csv(`${base}dataset/3_imdb-dataset_awards_long.csv`),
      d3.csv(`${base}dataset/3_imdb-dataset_general-info_wide.csv`),
    ]).then(([films, runs, festivals, awards, general]) => {
      setFilms(films);
      setRuns(runs);
      setFestivals(festivals);
      setAwards(awards);
      setGeneral(general);

      const fullGraph = BuildGraph(films, runs, festivals, awards, general);
      setGraph(fullGraph);
    });
  }, []);

  const runSimulation = () => {
    if (!graph) return;
    const filteredGraph = FilterFilms(graph, filters);

    const clonedGraph = {
      nodes: filteredGraph.nodes.map((node) => ({ ...node })),
      links: filteredGraph.links.map((link) => ({ ...link })),
    };

    setGraphData(clonedGraph);
  };

  return (
    <div className="home">
      <div className="home-layout">
        <NodeGraph
          data={graphData}
          repel={repel}
          attract={attract}
          colorAttribute={colorAttribute}
          minNodeSize={minNodeSize}
          maxNodeSize={maxNodeSize}
          filters={filters}
        />
        <div className="filter-section">
          <button className="simulation-button" onClick={runSimulation}>
            Run Simulation
          </button>
          <div className="force-box-set">
            <div className="force-box">
              <SingleRangeSlider
                label="Attraction Force"
                minval={1}
                maxval={100}
                value={attract}
                setValue={setAttract}
              />
            </div>
            <div className="force-box">
              <SingleRangeSlider
                label="Repelling Force"
                minval={1}
                maxval={100}
                value={repel}
                setValue={setRepel}
              />
            </div>
            <div className="force-box">
              <SingleRangeSlider
                label="Min Node Size"
                minval={1}
                maxval={maxNodeSize - 1}
                value={minNodeSize}
                setValue={setminNodeSize}
              />
            </div>
            <div className="force-box">
              <SingleRangeSlider
                label="Max Node Size"
                minval={minNodeSize + 1}
                maxval={50}
                value={maxNodeSize}
                setValue={setmaxNodeSize}
              />
            </div>
          </div>
          <ColorDropdown
            colorAttribute={colorAttribute}
            setColorAttribute={setColorAttribute}
            filters={filters}
          />
          <CompositeScore
            filters={filters}
            setFilters={setFilters}
            data={graph}
          />
          <br />
          <AttributeFilters
            filters={filters}
            setFilters={setFilters}
            films={films}
            festivals={festivals}
            awards={awards}
            runs={runs}
            general={general}
            graph={graph}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
