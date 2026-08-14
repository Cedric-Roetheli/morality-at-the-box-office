"use strict";

const {
  actorCategoryLabel,
  clampYearRange,
  filterFilmsByContent,
  filterFilmsByYear,
  getActorCategories,
} = window.FilmFilterUtils;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const SHARED_TREND_CONFIG = {
  xDomain: [1977, 2025],
  xTicks: [1977, 1985, 1993, 2001, 2009, 2017, 2025],
  compactXTicks: [1977, 1989, 2001, 2013, 2025],
  xLabel: "Year",
  yearlyLabel: "Yearly mean",
  movingAverageLabel: "Centered 5-year average",
};

const METRIC_CONFIGS = [
  {
    ...SHARED_TREND_CONFIG,
    id: "moral-scope-trend",
    metric: "moral_scope_index",
    title: "Moral Scope Over Time",
    subtitle: "Average Moral Scope Index among the highest-grossing films worldwide, 1977–2025.",
    yDomain: [0, 6],
    yTicks: [0, 1, 2, 3, 4, 5, 6],
    yLabel: "Average MSI",
    tooltipMetricLabel: "Mean MSI",
    scaleDescription:
      "0–6 scale. Moral Scope combines Victim Level and Hero–Victim Distance (S + D); higher values indicate broader moral scope.",
  },
  {
    ...SHARED_TREND_CONFIG,
    id: "victim-level-trend",
    metric: "victim_level",
    title: "Who is at stake?",
    subtitle: "Average scale of the main threatened victim.",
    yDomain: [0, 3],
    yTicks: [0, 1, 2, 3],
    yLabel: "Average victim level",
    tooltipMetricLabel: "Mean victim level",
    scaleLabels: [
      { value: 0, label: "Individual" },
      { value: 1, label: "Small group" },
      { value: 2, label: "Community / nation" },
      { value: 3, label: "Humanity / planet" },
    ],
  },
  {
    ...SHARED_TREND_CONFIG,
    id: "hero-victim-distance-trend",
    metric: "hero_victim_distance",
    title: "How distant is the victim from the hero?",
    subtitle: "Average social distance between the hero and the main threatened victim.",
    yDomain: [0, 3],
    yTicks: [0, 1, 2, 3],
    yLabel: "Average distance",
    tooltipMetricLabel: "Mean distance",
    scaleLabels: [
      { value: 0, label: "Intimate" },
      { value: 1, label: "Local community" },
      { value: 2, label: "Same country / group" },
      { value: 3, label: "Distant / universal" },
    ],
  },
  {
    ...SHARED_TREND_CONFIG,
    id: "conflict-scale-trend",
    metric: "conflict_scale",
    title: "How large is the conflict?",
    subtitle: "Average geographic scale of the central conflict.",
    yDomain: [0, 3],
    yTicks: [0, 1, 2, 3],
    yLabel: "Average conflict scale",
    tooltipMetricLabel: "Mean conflict scale",
    scaleLabels: [
      { value: 0, label: "Local" },
      { value: 1, label: "National" },
      { value: 2, label: "International" },
      { value: 3, label: "Global / planetary" },
    ],
  },
];

const CONTENT_FILTER_CONFIGS = [
  {
    key: "moralScope",
    options: Array.from({ length: 7 }, (_, value) => ({ value, label: String(value) })),
  },
  {
    key: "victimLevel",
    options: [
      { value: 0, label: "0 — Individual" },
      { value: 1, label: "1 — Small group" },
      { value: 2, label: "2 — Community / nation" },
      { value: 3, label: "3 — Humanity / planet" },
    ],
  },
  { key: "heroType", actorField: "hero_actor" },
  { key: "villainType", actorField: "villain_actor" },
  {
    key: "conflictScale",
    options: [
      { value: 0, label: "0 — Local" },
      { value: 1, label: "1 — National" },
      { value: 2, label: "2 — International" },
      { value: 3, label: "3 — Global / planetary" },
    ],
  },
];

const trendSections = document.querySelectorAll("[data-trend-section]");
const trendYearControls = {
  yearMin: document.querySelector("[data-trend-year-min]"),
  yearMax: document.querySelector("[data-trend-year-max]"),
};
const trendMultiFilterControls = [...document.querySelectorAll("[data-trend-multi-filter]")]
  .map((element) => ({
    element,
    key: element.dataset.filterKey,
    allLabel: element.dataset.allLabel,
    details: element.querySelector("[data-trend-multi-details]"),
    summary: element.querySelector("[data-trend-multi-summary]"),
    options: element.querySelector("[data-trend-multi-options]"),
  }));
const trendMultiFiltersByKey = new Map(
  trendMultiFilterControls.map((control) => [control.key, control]),
);
const trendYearOutput = document.querySelector("[data-trend-year-output]");
const trendResultCount = document.querySelector("[data-trend-result-count]");
const trendResetButton = document.querySelector("[data-trend-reset]");
const trendFilterStatus = document.querySelector("[data-trend-filter-status]");
const trendFiltersReady = Object.values(trendYearControls).every(Boolean)
  && trendMultiFilterControls.length === CONTENT_FILTER_CONFIGS.length
  && trendMultiFilterControls.every((control) => (
    control.key && control.allLabel && control.details && control.summary && control.options
  ))
  && CONTENT_FILTER_CONFIGS.every((config) => trendMultiFiltersByKey.has(config.key))
  && [trendYearOutput, trendResultCount, trendResetButton, trendFilterStatus].every(Boolean);

if (trendSections.length > 0 && trendFiltersReady) {
  loadTrendData();
}

async function loadTrendData() {
  try {
    const response = await fetch("data/films.json");

    if (!response.ok) {
      throw new Error(`Film data request failed with status ${response.status}.`);
    }

    const films = await response.json();

    if (!Array.isArray(films)) {
      throw new Error("Film data is not an array.");
    }

    initializeTrendFilters(films);
  } catch (error) {
    console.error(error);
    trendResultCount.textContent = "Films could not be loaded.";
    showAllChartErrors();
  }
}

function initializeTrendFilters(films) {
  const updateTrends = () => {
    const selectedYearRange = getSelectedYearRange();
    const contentFilters = getSelectedContentFilters();
    const baselineFilms = filterFilmsByYear(films, ...selectedYearRange);
    const filteredFilms = filterFilmsByContent(baselineFilms, contentFilters);
    const showBaseline = hasActiveContentFilters(contentFilters);

    trendYearOutput.textContent = selectedYearRange.join("–");
    trendResultCount.textContent = createTrendResultSummary(
      filteredFilms.length,
      baselineFilms.length,
      showBaseline,
    );

    if (filteredFilms.length === 0) {
      trendFilterStatus.hidden = false;
      setTrendSectionsHidden(true);
      return;
    }

    trendFilterStatus.hidden = true;
    setTrendSectionsHidden(false);
    renderAllTrendCharts(filteredFilms, baselineFilms, selectedYearRange, showBaseline);
  };

  initializeMultiFilterControls(films, updateTrends);
  initializeMultiFilterDisclosureBehavior();

  trendYearControls.yearMin.addEventListener("input", () => {
    clampYearRange(trendYearControls.yearMin, trendYearControls.yearMax, trendYearControls.yearMin);
    updateTrends();
  });
  trendYearControls.yearMax.addEventListener("input", () => {
    clampYearRange(trendYearControls.yearMin, trendYearControls.yearMax, trendYearControls.yearMax);
    updateTrends();
  });

  trendResetButton.addEventListener("click", () => {
    resetTrendFilters();
    updateTrends();
  });
  trendResetButton.disabled = false;
  updateTrends();
}

function initializeMultiFilterControls(films, updateTrends) {
  for (const config of CONTENT_FILTER_CONFIGS) {
    const control = trendMultiFiltersByKey.get(config.key);
    const fragment = document.createDocumentFragment();

    for (const option of getContentFilterOptions(config, films)) {
      fragment.append(createMultiFilterOption(option));
    }

    control.options.replaceChildren(fragment);
    control.options.addEventListener("change", (event) => {
      if (event.target.matches('input[type="checkbox"]')) {
        updateMultiFilterSummary(control);
        updateTrends();
      }
    });
    updateMultiFilterSummary(control);
  }
}

function getContentFilterOptions(config, films) {
  if (config.options) {
    return config.options;
  }

  return getActorCategories(films, config.actorField)
    .map((category) => ({ value: category, label: actorCategoryLabel(category) }));
}

function createMultiFilterOption({ value, label }) {
  const optionLabel = document.createElement("label");
  const checkbox = document.createElement("input");
  const text = document.createElement("span");

  checkbox.type = "checkbox";
  checkbox.value = value;
  checkbox.dataset.optionLabel = label;
  text.textContent = label;
  optionLabel.append(checkbox, text);
  return optionLabel;
}

function initializeMultiFilterDisclosureBehavior() {
  for (const control of trendMultiFilterControls) {
    control.details.addEventListener("toggle", () => {
      if (!control.details.open) {
        return;
      }

      for (const otherControl of trendMultiFilterControls) {
        if (otherControl !== control) {
          otherControl.details.removeAttribute("open");
        }
      }
    });

    control.details.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && control.details.open) {
        control.details.removeAttribute("open");
        control.details.querySelector("summary").focus();
        event.preventDefault();
      }
    });
  }

  document.addEventListener("click", (event) => {
    for (const control of trendMultiFilterControls) {
      if (control.details.open && !control.element.contains(event.target)) {
        control.details.removeAttribute("open");
      }
    }
  });
}

function getSelectedYearRange() {
  return [Number(trendYearControls.yearMin.value), Number(trendYearControls.yearMax.value)];
}

function getSelectedContentFilters() {
  return Object.fromEntries(
    trendMultiFilterControls.map((control) => [control.key, getSelectedValues(control)]),
  );
}

function getSelectedValues(control) {
  return [...control.options.querySelectorAll('input[type="checkbox"]:checked')]
    .map((checkbox) => checkbox.value);
}

function hasActiveContentFilters(filters) {
  return Object.values(filters).some((selectedValues) => selectedValues.length > 0);
}

function updateMultiFilterSummary(control) {
  const selectedCheckboxes = [...control.options.querySelectorAll('input[type="checkbox"]:checked')];

  if (selectedCheckboxes.length === 0) {
    control.summary.textContent = control.allLabel;
  } else if (selectedCheckboxes.length === 1) {
    control.summary.textContent = selectedCheckboxes[0].dataset.optionLabel;
  } else {
    control.summary.textContent = `${selectedCheckboxes.length} selected`;
  }
}

function createTrendResultSummary(filteredCount, baselineCount, hasContentFilters) {
  if (hasContentFilters) {
    return `${filteredCount} of ${formatFilmCount(baselineCount)} in selected period`;
  }

  return `${formatFilmCount(baselineCount)} in selected period`;
}

function formatFilmCount(count) {
  return `${count} ${count === 1 ? "film" : "films"}`;
}

function resetTrendFilters() {
  trendYearControls.yearMin.value = trendYearControls.yearMin.min;
  trendYearControls.yearMax.value = trendYearControls.yearMax.max;

  for (const control of trendMultiFilterControls) {
    for (const checkbox of control.options.querySelectorAll('input[type="checkbox"]')) {
      checkbox.checked = false;
    }

    control.details.removeAttribute("open");
    updateMultiFilterSummary(control);
  }
}

function setTrendSectionsHidden(hidden) {
  for (const section of trendSections) {
    section.hidden = hidden;
  }
}

function renderAllTrendCharts(filteredFilms, baselineFilms, selectedYearRange, showBaseline) {
  for (const config of METRIC_CONFIGS) {
    const section = document.querySelector(`[data-trend-section="${config.id}"]`);

    if (!section) {
      continue;
    }

    const container = section.querySelector("[data-trend-chart]");
    const title = section.querySelector("[data-trend-title]");
    const subtitle = section.querySelector("[data-trend-subtitle]");
    const scaleContainer = section.querySelector("[data-trend-scale]");
    const selectedYearlyData = computeYearlyMeans(filteredFilms, config.metric);
    const selectedMovingAverageData = computeCenteredMovingAverage(selectedYearlyData, 5);
    const baselineYearlyData = computeYearlyMeans(baselineFilms, config.metric);
    const baselineMovingAverageData = computeCenteredMovingAverage(baselineYearlyData, 5);
    const chartConfig = createChartConfig(config, selectedYearRange);

    title.textContent = config.title;
    subtitle.textContent = config.subtitle;
    renderScaleExplanation(scaleContainer, config);
    renderTrendChart(
      container,
      selectedYearlyData,
      selectedMovingAverageData,
      baselineMovingAverageData,
      chartConfig,
      showBaseline,
    );
  }
}

function createChartConfig(config, selectedYearRange) {
  return {
    ...config,
    xDomain: selectedYearRange,
    xTicks: createYearTicks(selectedYearRange, 7),
    compactXTicks: createYearTicks(selectedYearRange, 5),
  };
}

function createYearTicks([startYear, endYear], maximumTickCount) {
  if (startYear === endYear) {
    return [startYear];
  }

  const intervalCount = Math.min(maximumTickCount - 1, endYear - startYear);
  const ticks = [];

  for (let index = 0; index <= intervalCount; index += 1) {
    const position = index / intervalCount;
    ticks.push(Math.round(startYear + (endYear - startYear) * position));
  }

  return [...new Set(ticks)];
}

function renderScaleExplanation(container, config) {
  container.replaceChildren();

  if (config.scaleDescription) {
    const description = document.createElement("p");
    description.className = "trend-scale__note";
    description.textContent = config.scaleDescription;
    container.append(description);
    return;
  }

  const labels = document.createElement("dl");
  labels.className = "trend-scale__labels";

  for (const { value, label } of config.scaleLabels) {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const definition = document.createElement("dd");

    term.textContent = value;
    definition.textContent = `— ${label}`;
    item.append(term, definition);
    labels.append(item);
  }

  container.append(labels);
}

function showAllChartErrors() {
  for (const section of trendSections) {
    const container = section.querySelector("[data-trend-chart]");
    showChartError(container);
  }
}

function computeYearlyMeans(films, metric) {
  const yearlyTotals = new Map();

  for (const film of films) {
    const year = film.year;
    const value = film[metric];

    if (!Number.isInteger(year) || !Number.isFinite(value)) {
      continue;
    }

    const total = yearlyTotals.get(year) ?? { sum: 0, count: 0 };
    total.sum += value;
    total.count += 1;
    yearlyTotals.set(year, total);
  }

  return [...yearlyTotals.entries()]
    .sort(([firstYear], [secondYear]) => firstYear - secondYear)
    .map(([year, total]) => ({
      year,
      mean: total.sum / total.count,
      count: total.count,
    }));
}

function computeCenteredMovingAverage(yearlyData, windowSize) {
  if (!Number.isInteger(windowSize) || windowSize < 1 || windowSize % 2 === 0) {
    throw new Error("Moving-average window size must be a positive odd integer.");
  }

  const radius = Math.floor(windowSize / 2);
  const dataByYear = new Map(yearlyData.map((point) => [point.year, point]));

  return yearlyData.map((point) => {
    const windowValues = [];

    for (let offset = -radius; offset <= radius; offset += 1) {
      const windowPoint = dataByYear.get(point.year + offset);

      if (!windowPoint || !Number.isFinite(windowPoint.mean)) {
        return { year: point.year, mean: null };
      }

      windowValues.push(windowPoint.mean);
    }

    const mean = windowValues.reduce((sum, value) => sum + value, 0) / windowSize;
    return { year: point.year, mean };
  });
}

function renderTrendChart(
  container,
  selectedYearlyData,
  selectedMovingAverageData,
  baselineMovingAverageData,
  config,
  showBaseline,
) {
  if (selectedYearlyData.length === 0) {
    showEmptyChart(container);
    return;
  }

  const width = Math.max(320, Math.round(container.getBoundingClientRect().width));
  const compact = width < 560;
  const height = compact ? 370 : 460;
  const margin = compact
    ? { top: 24, right: 12, bottom: 54, left: 46 }
    : { top: 28, right: 24, bottom: 58, left: 58 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const xScale = createLinearScale(config.xDomain, [margin.left, margin.left + plotWidth]);
  const yScale = createLinearScale(config.yDomain, [margin.top + plotHeight, margin.top]);
  const selectedYearlySeries = completeYearSeries(selectedYearlyData, config.xDomain);
  const selectedMovingAverageSeries = completeYearSeries(selectedMovingAverageData, config.xDomain);
  const baselineMovingAverageSeries = completeYearSeries(baselineMovingAverageData, config.xDomain);
  const svg = createSvgElement("svg");
  const tooltip = createTooltip();
  const titleId = `${config.id}-title`;
  const descriptionId = `${config.id}-description`;

  svg.setAttribute("class", "trend-chart__svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-labelledby", `${titleId} ${descriptionId}`);
  svg.append(
    createSvgTextElement("title", titleId, config.title),
    createSvgTextElement(
      "desc",
      descriptionId,
      createChartDescription(config, showBaseline),
    ),
  );

  renderAxes(svg, xScale, yScale, width, height, margin, compact, config);
  if (showBaseline) {
    svg.append(
      createLinePath(
        baselineMovingAverageSeries,
        xScale,
        yScale,
        "trend-chart__baseline-line",
      ),
    );
  }
  svg.append(
    createLinePath(selectedYearlySeries, xScale, yScale, "trend-chart__yearly-line"),
    createLinePath(selectedMovingAverageSeries, xScale, yScale, "trend-chart__moving-line"),
  );
  renderYearlyPoints(svg, tooltip, container, selectedYearlyData, xScale, yScale, config);

  container.replaceChildren(createLegend(config, showBaseline), svg, tooltip);
}

function createChartDescription(config, showBaseline) {
  const comparisonDescription = showBaseline
    ? " The centered 5-year average for all films in the selected period is shown as a comparison."
    : "";

  return `${config.subtitle} The chart compares selected yearly means with a centered 5-year moving average.${comparisonDescription}`;
}

function completeYearSeries(data, [startYear, endYear]) {
  const dataByYear = new Map(data.map((point) => [point.year, point]));
  const series = [];

  for (let year = startYear; year <= endYear; year += 1) {
    series.push(dataByYear.get(year) ?? { year, mean: null });
  }

  return series;
}

function createLinearScale([domainMin, domainMax], [rangeMin, rangeMax]) {
  if (domainMin === domainMax) {
    const rangeMidpoint = rangeMin + (rangeMax - rangeMin) / 2;
    return () => rangeMidpoint;
  }

  return (value) => {
    const ratio = (value - domainMin) / (domainMax - domainMin);
    return rangeMin + ratio * (rangeMax - rangeMin);
  };
}

function renderAxes(svg, xScale, yScale, width, height, margin, compact, config) {
  const plotRight = width - margin.right;
  const plotBottom = height - margin.bottom;

  for (const tick of config.yTicks) {
    const y = yScale(tick);
    svg.append(
      createSvgLine(margin.left, y, plotRight, y, "trend-chart__grid-line"),
      createSvgLabel(margin.left - 10, y + 4, tick, "end", "trend-chart__tick-label"),
    );
  }

  svg.append(
    createSvgLine(margin.left, margin.top, margin.left, plotBottom, "trend-chart__axis-line"),
    createSvgLine(margin.left, plotBottom, plotRight, plotBottom, "trend-chart__axis-line"),
  );

  const xTicks = compact ? config.compactXTicks : config.xTicks;
  for (const tick of xTicks) {
    const x = xScale(tick);
    svg.append(
      createSvgLine(x, plotBottom, x, plotBottom + 6, "trend-chart__axis-line"),
      createSvgLabel(x, plotBottom + 24, tick, "middle", "trend-chart__tick-label"),
    );
  }

  const xLabel = createSvgLabel(
    margin.left + (plotRight - margin.left) / 2,
    height - 8,
    config.xLabel,
    "middle",
    "trend-chart__axis-label",
  );
  const yLabel = createSvgLabel(
    14,
    margin.top + (plotBottom - margin.top) / 2,
    config.yLabel,
    "middle",
    "trend-chart__axis-label",
  );
  yLabel.setAttribute("transform", `rotate(-90 14 ${margin.top + (plotBottom - margin.top) / 2})`);
  svg.append(xLabel, yLabel);
}

function createLinePath(data, xScale, yScale, className) {
  const path = createSvgElement("path");
  let pathData = "";
  let segmentOpen = false;

  for (const point of data) {
    if (!Number.isFinite(point.mean)) {
      segmentOpen = false;
      continue;
    }

    const command = segmentOpen ? "L" : "M";
    pathData += `${command} ${xScale(point.year).toFixed(2)} ${yScale(point.mean).toFixed(2)} `;
    segmentOpen = true;
  }

  path.setAttribute("class", className);
  path.setAttribute("d", pathData.trim());
  return path;
}

function renderYearlyPoints(svg, tooltip, container, data, xScale, yScale, config) {
  for (const point of data) {
    const x = xScale(point.year);
    const y = yScale(point.mean);
    const marker = createSvgElement("circle");
    const target = createSvgElement("circle");
    const show = () => showTooltip(tooltip, target, container, point, config);

    setCircleAttributes(marker, x, y, 3, "trend-chart__point");
    setCircleAttributes(target, x, y, 9, "trend-chart__point-target");
    target.setAttribute("tabindex", "0");
    target.setAttribute(
      "aria-label",
      `${point.year}. ${config.tooltipMetricLabel}: ${point.mean.toFixed(2)}. Films: ${point.count}.`,
    );
    target.addEventListener("mouseenter", show);
    target.addEventListener("mouseleave", () => hideTooltip(tooltip));
    target.addEventListener("focus", show);
    target.addEventListener("blur", () => hideTooltip(tooltip));
    target.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideTooltip(tooltip);
      }
    });
    svg.append(marker, target);
  }
}

function createLegend(config, showBaseline) {
  const legend = document.createElement("ul");
  legend.className = "trend-chart__legend";
  legend.setAttribute("aria-label", "Chart legend");
  legend.append(createLegendItem(config.yearlyLabel, "trend-chart__legend-line--yearly"));

  if (showBaseline) {
    legend.append(
      createLegendItem("Selected sample (5-year average)", "trend-chart__legend-line--moving"),
      createLegendItem(
        "All films in selected period (5-year average)",
        "trend-chart__legend-line--baseline",
      ),
    );
  } else {
    legend.append(
      createLegendItem(config.movingAverageLabel, "trend-chart__legend-line--moving"),
    );
  }

  return legend;
}

function createLegendItem(label, lineClass) {
  const item = document.createElement("li");
  const line = document.createElement("span");
  line.className = `trend-chart__legend-line ${lineClass}`;
  line.setAttribute("aria-hidden", "true");
  item.append(line, label);
  return item;
}

function createTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "trend-chart__tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  tooltip.append(
    document.createElement("strong"),
    document.createElement("span"),
    document.createElement("span"),
  );
  return tooltip;
}

function showTooltip(tooltip, target, container, point, config) {
  const [year, mean, count] = tooltip.children;
  year.textContent = point.year;
  mean.textContent = `${config.tooltipMetricLabel}: ${point.mean.toFixed(2)}`;
  count.textContent = `Films: ${point.count}`;
  tooltip.hidden = false;

  const targetBounds = target.getBoundingClientRect();
  const containerBounds = container.getBoundingClientRect();
  const targetCenter = targetBounds.left - containerBounds.left + targetBounds.width / 2;
  const halfTooltipWidth = tooltip.offsetWidth / 2;
  const targetTop = targetBounds.top - containerBounds.top;
  const targetBottom = targetBounds.bottom - containerBounds.top;
  const placeBelow = targetTop < tooltip.offsetHeight + 16;
  const safeLeft = Math.min(
    Math.max(targetCenter, halfTooltipWidth + 8),
    containerBounds.width - halfTooltipWidth - 8,
  );
  tooltip.classList.toggle("trend-chart__tooltip--below", placeBelow);
  tooltip.style.left = `${safeLeft}px`;
  tooltip.style.top = `${placeBelow ? targetBottom : targetTop}px`;
}

function hideTooltip(tooltip) {
  tooltip.hidden = true;
}

function createSvgElement(tagName) {
  return document.createElementNS(SVG_NAMESPACE, tagName);
}

function createSvgTextElement(tagName, id, text) {
  const element = createSvgElement(tagName);
  element.setAttribute("id", id);
  element.textContent = text;
  return element;
}

function createSvgLine(x1, y1, x2, y2, className) {
  const line = createSvgElement("line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("class", className);
  return line;
}

function createSvgLabel(x, y, text, anchor, className) {
  const label = createSvgElement("text");
  label.setAttribute("x", x);
  label.setAttribute("y", y);
  label.setAttribute("text-anchor", anchor);
  label.setAttribute("class", className);
  label.textContent = text;
  return label;
}

function setCircleAttributes(circle, cx, cy, radius, className) {
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", radius);
  circle.setAttribute("class", className);
}

function showEmptyChart(container) {
  showChartStatus(container, "No trend data available.");
}

function showChartError(container) {
  showChartStatus(container, "The trend data could not be loaded. Please try again later.", true);
}

function showChartStatus(container, message, isError = false) {
  const status = document.createElement("p");
  status.className = isError
    ? "trend-chart__status trend-chart__status--error"
    : "trend-chart__status";
  status.textContent = message;

  if (isError) {
    status.setAttribute("role", "alert");
  }

  container.replaceChildren(status);
}
