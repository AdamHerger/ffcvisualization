import Select from "react-select";

function ColorDropdown({ colorAttribute, setColorAttribute, filters }) {
  const options = [
    { value: "default", label: "Default" },
    ...(filters.isCompositeScoreActive
      ? [{ value: "compositescore", label: "Composite Score" }]
      : []),
    { value: "country", label: "Country" },
    { value: "region", label: "Region" },
    { value: "genres", label: "Genre" },
    { value: "languages", label: "Language" },
    { value: "year", label: "Year" },
    { value: "awards", label: "Awards" },
    { value: "runtime", label: "Runtime" },
    { value: "genre", label: "Category" },
    { value: "rating", label: "Rating" },
    { value: "connections", label: "Connections" },
    { value: "releaseTypes", label: "Release Type" },
    { value: "genderTeam", label: "Gender Team" },
    { value: "budget", label: "Budget" },
    { value: "openingusa", label: "Opening USA" },
    { value: "grossusa", label: "Gross USA" },
    { value: "grossworld", label: "Gross World" },
  ];

  const selectedOption =
    options.find((opt) => opt.value === colorAttribute) || options[0];

  return (
    <div className="color-dropdown" style={{ marginBottom: "15px" }}>
      <p>Color Nodes By</p>
      <Select
        value={selectedOption}
        onChange={(selected) =>
          setColorAttribute(selected ? selected.value : "default")
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

export default ColorDropdown;
