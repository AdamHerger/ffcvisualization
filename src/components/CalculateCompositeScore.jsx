const compositeAttributes = [
  ["year", "minYear", "maxYear", "linear"],
  ["runtime", "minRuntime", "maxRuntime", "linear"],
  ["connections", "minConnections", "maxConnections", "linear"],
  ["rating", "minRating", "maxRating", "linear"],
  ["budget", "minBudget", "maxBudget", "log"],
  ["openingusa", "minOpeningUSA", "maxOpeningUSA", "log"],
  ["grossusa", "minGrossUSA", "maxGrossUSA", "log"],
  ["grossworld", "minGrossWorld", "maxGrossWorld", "log"],
];

function normalizeLinear(value, min, max) {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function normalizeLog(value, min, max) {
  if (value <= 0 || max <= min) return 0;

  const logValue = Math.log(value);
  const logMin = Math.log(Math.max(min, 1));
  const logMax = Math.log(max);

  return Math.max(0, Math.min(1, (logValue - logMin) / (logMax - logMin)));
}

function CalculateCompositeScore(film, filters) {
  const data = filters?.compositeScore;
  if (!data || data.size === 0) {
    return 0;
  }

  let weightedScore = 0;
  let totalWeight = 0;

  for (const [attribute, minFilter, maxFilter, norm] of compositeAttributes) {
    const settings = data.get(attribute);

    if (!settings) continue;

    let weight = Math.min(Math.max(Number(settings.weight ?? 0), 0), 100);

    const preference = settings.preference ?? "max";

    const value = Number(film[attribute]);

    const min = Number(filters[minFilter]);
    const max = Number(filters[maxFilter]);

    if (!Number.isFinite(value) || value < 0 || weight <= 0) {
      totalWeight += weight;
      continue;
    }

    let normalized =
      norm === "linear"
        ? normalizeLinear(value, min, max)
        : normalizeLog(value, min, max);

    if (preference === "min") normalized = 1 - normalized;
    if (preference === "target") {
      const target = Number(settings.target);
      if (!Number.isFinite(target)) continue;
      const normalizedTarget =
        norm === "linear"
          ? normalizeLinear(target, min, max)
          : normalizeLog(target, min, max);
      const distance = Math.abs(normalized - normalizedTarget);
      normalized = 1 - distance;
    }

    weightedScore += normalized * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0;

  return (weightedScore / totalWeight) * 100;
}
export default CalculateCompositeScore;
