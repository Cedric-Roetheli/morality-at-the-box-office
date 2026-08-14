"use strict";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const trendChart = document.querySelector("[data-trend-chart]");

const MORAL_SCOPE_CONFIG = {
  id: "moral-scope-trend",
  metric: "moral_scope_index",
  xDomain: [1977, 2025],
  yDomain: [0, 6],
  xTicks: [1977, 1985, 1993, 2001, 2009, 2017, 2025],
  compactXTicks: [1977, 1989, 2001, 2013, 2025],
  yTicks: [0, 1, 2, 3, 4, 5, 6],
  xLabel: "Year",
  yLabel: "Average MSI",
  yearlyLabel: "Yearly mean",
  movingAverageLabel: "Centered 5-year average",
  tooltipMetricLabel: "Mean MSI",
  ariaTitle: "Moral Scope Over Time",
  ariaDescription: "Yearly mean Moral Scope Index and centered 5-year moving average from 1977 to 2025.",
};

if (trendChart) {
  loadTrendData(trendChart, MORAL_SCOPE_CONFIG);
}

async function loadTrendData(container, config) {
  try {
    const response = await fetch("data/films.json");

    if (!response.ok) {
      throw new Error(`Film data request failed with status ${response.status}.`);
    }

    const films = await response.json();

    if (!Array.isArray(films)) {
      throw new Error("Film data is not an array.");
    }

    const yearlyData = computeYearlyMeans(films, config.metric);
    const movingAverageData = computeCenteredMovingAverage(yearlyData, 5);
    renderTrendChart(container, yearlyData, movingAverageData, config);
  } catch (error) {
    console.error(error);
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

function renderTrendChart(container, yearlyData, movingAverageData, config) {
  if (yearlyData.length === 0) {
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
  const yearlySeries = completeYearSeries(yearlyData, config.xDomain);
  const movingAverageSeries = completeYearSeries(movingAverageData, config.xDomain);
  const svg = createSvgElement("svg");
  const tooltip = createTooltip();
  const titleId = `${config.id}-title`;
  const descriptionId = `${config.id}-description`;

  svg.setAttribute("class", "trend-chart__svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-labelledby", `${titleId} ${descriptionId}`);
  svg.append(
    createSvgTextElement("title", titleId, config.ariaTitle),
    createSvgTextElement("desc", descriptionId, config.ariaDescription),
  );

  renderAxes(svg, xScale, yScale, width, height, margin, compact, config);
  svg.append(
    createLinePath(yearlySeries, xScale, yScale, "trend-chart__yearly-line"),
    createLinePath(movingAverageSeries, xScale, yScale, "trend-chart__moving-line"),
  );
  renderYearlyPoints(svg, tooltip, container, yearlyData, xScale, yScale, config);

  container.replaceChildren(createLegend(config), svg, tooltip);
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

function createLegend(config) {
  const legend = document.createElement("ul");
  legend.className = "trend-chart__legend";
  legend.setAttribute("aria-label", "Chart legend");
  legend.append(
    createLegendItem(config.yearlyLabel, "trend-chart__legend-line--yearly"),
    createLegendItem(config.movingAverageLabel, "trend-chart__legend-line--moving"),
  );
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
