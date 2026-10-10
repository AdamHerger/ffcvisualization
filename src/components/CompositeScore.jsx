import { useEffect, useRef, useMemo } from "react";
import CompositeScoreDistributionGraph from "./CompositeScoreDistributionGraph";
import CompositeScoreRangeSlider from "./CompositeScoreRangeSlider";
import InfoHover from "./InfoHover";

function CompositeScore({ filters, setFilters, data }) {
  const numericAttributes = [
    ["year", "minYear", "maxYear"],
    ["runtime", "minRuntime", "maxRuntime"],
    ["connections", "minConnections", "maxConnections"],
    ["rating", "minRating", "maxRating"],
    ["budget", "minBudget", "maxBudget"],
    ["openingusa", "minOpeningUSA", "maxOpeningUSA"],
    ["grossusa", "minGrossUSA", "maxGrossUSA"],
    ["grossworld", "minGrossWorld", "maxGrossWorld"],
  ];

  const handleWeightChange = (attribute, value) => {
    const newCompositeScore = new Map(filters.compositeScore);
    const current = newCompositeScore.get(attribute);

    newCompositeScore.set(attribute, { ...current, weight: Number(value) });
    setFilters({ ...filters, compositeScore: newCompositeScore });
  };

  const handlePreferenceChange = (attribute, preference) => {
    const newCompositeScore = new Map(filters.compositeScore);
    const current = newCompositeScore.get(attribute);

    newCompositeScore.set(attribute, { ...current, preference });
    setFilters({ ...filters, compositeScore: newCompositeScore });
  };

  const handleTargetChange = (attribute, value) => {
    const newCompositeScore = new Map(filters.compositeScore);
    const current = newCompositeScore.get(attribute);

    newCompositeScore.set(attribute, { ...current, target: Number(value) });
    setFilters({ ...filters, compositeScore: newCompositeScore });
  };

  return (
    <details
      onToggle={(e) => {
        setFilters({
          ...filters,
          isCompositeScoreActive: e.currentTarget.open,
        });
      }}
    >
      <summary>
        Composite Score
        <InfoHover text="The composite score allows you to add weights to every numeric attribute resulting in one final combined score. Weights are valued 0-100 (must not necessarily add up to 100 total). Optimize for either a min, max, or target value and filter the resulting distribution below. NA values are counted as 0." />
      </summary>
      <br />

      <div className="compositescore-table">
        <div className="composite-score-header">
          <label className="attribute-column">Attribute</label>
          <label className="weight-column">Weight</label>
          <label className="type-column">Type</label>
          <label className="target-column">Target</label>
        </div>

        {numericAttributes.map(([attribute, minFilter, maxFilter]) => {
          const settings = filters.compositeScore.get(attribute);
          const min = filters[minFilter];
          const max = filters[maxFilter];

          return (
            <div className="composite-score-row" key={attribute}>
              <label className="attribute-column">
                {attribute.charAt(0).toUpperCase() + attribute.slice(1)}
              </label>
              <div className="weight-column">
                <input
                  className="compositescore-input"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.weight}
                  onChange={(e) =>
                    handleWeightChange(attribute, e.target.value)
                  }
                />
              </div>
              <div className="type-column">
                <select
                  value={settings.preference}
                  onChange={(e) =>
                    handlePreferenceChange(attribute, e.target.value)
                  }
                >
                  <option value="min">Min</option>
                  <option value="target">Target</option>
                  <option value="max">Max</option>
                </select>
              </div>
              <div className="target-column">
                {settings.preference === "target" && (
                  <input
                    className="compositescore-target-input"
                    type="number"
                    min={min}
                    max={max}
                    value={settings.target ?? min}
                    onChange={(e) =>
                      handleTargetChange(attribute, e.target.value)
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
        <div className="filter-component">
          <CompositeScoreDistributionGraph data={data} filters={filters} />
        </div>
        <CompositeScoreRangeSlider filters={filters} setFilters={setFilters} />
      </div>
    </details>
  );
}

export default CompositeScore;
