import Select from "react-select";
import InfoHover from "./InfoHover";

function NodeSizeDropdown({ nodeSizeBy, setnodeSizeBy, filters }) {
  const options = [
    { value: "connections", label: "Connections" },
    ...(filters.isCompositeScoreActive
      ? [{ value: "compositescore", label: "Composite Score" }]
      : []),
    { value: "year", label: "Year" },
    { value: "runtime", label: "Runtime" },
    { value: "rating", label: "Rating" },
    { value: "budget", label: "Budget" },
    { value: "openingusa", label: "Opening USA" },
    { value: "grossusa", label: "Gross USA" },
    { value: "grossworld", label: "Gross World" },
  ];

  const selectedOption =
    options.find((opt) => opt.value === nodeSizeBy) || options[0];

  return (
    <div className="color-dropdown" style={{ marginBottom: "15px" }}>
      <br />
      <summary>
        Node Size By
        <InfoHover text="This filter allows you to change what attribute influences the node size. Larger values receive a larger node radius and vice versa." />
      </summary>{" "}
      <br />
      <Select
        value={selectedOption}
        onChange={(selected) =>
          setnodeSizeBy(selected ? selected.value : "default")
        }
        options={options}
        classNamePrefix="filter-select"
        isSearchable={false}
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: "white",
            borderColor: "white",
            color: "white",
            cursor: "pointer",
          }),
          option: (base, { isFocused }) => ({
            ...base,
            backgroundColor: isFocused ? "#dcecff" : "white",
            cursor: "pointer",
          }),
          singleValue: (base) => ({
            ...base,
            color: "white",
          }),
        }}
      />
    </div>
  );
}

export default NodeSizeDropdown;
