"use strict";

const { clampYearRange, filterFilms, populateActorOptions } = window.FilmFilterUtils;
const filmList = document.querySelector("[data-film-list]");
const filmResultCount = document.querySelector("[data-film-result-count]");
const filterControls = {
  search: document.querySelector("[data-film-search]"),
  yearMin: document.querySelector("[data-film-year-min]"),
  yearMax: document.querySelector("[data-film-year-max]"),
  moralScope: document.querySelector("[data-film-moral-scope]"),
  victimLevel: document.querySelector("[data-film-victim-level]"),
  heroType: document.querySelector("[data-film-hero-type]"),
  villainType: document.querySelector("[data-film-villain-type]"),
  conflictScale: document.querySelector("[data-film-conflict-scale]"),
};
const yearRangeOutput = document.querySelector("[data-film-year-output]");

if (filmList && filmResultCount && yearRangeOutput && Object.values(filterControls).every(Boolean)) {
  loadFilms(filmList, filterControls, yearRangeOutput, filmResultCount);
}

async function loadFilms(container, controls, rangeOutput, resultCount) {
  try {
    const response = await fetch("data/films.json");

    if (!response.ok) {
      throw new Error(`Film data request failed with status ${response.status}.`);
    }

    const films = await response.json();

    if (!Array.isArray(films)) {
      throw new Error("Film data is not an array.");
    }

    films.sort((first, second) => first.year - second.year || first.rank - second.rank);
    populateActorOptions(controls.heroType, films, "hero_actor");
    populateActorOptions(controls.villainType, films, "villain_actor");

    const updateResults = () => {
      const matchingFilms = filterFilms(films, {
        searchTerm: controls.search.value,
        yearMin: Number(controls.yearMin.value),
        yearMax: Number(controls.yearMax.value),
        moralScope: controls.moralScope.value,
        victimLevel: controls.victimLevel.value,
        heroType: controls.heroType.value,
        villainType: controls.villainType.value,
        conflictScale: controls.conflictScale.value,
      });
      rangeOutput.textContent = `${controls.yearMin.value}–${controls.yearMax.value}`;
      renderFilms(container, matchingFilms);
      showResultCount(resultCount, matchingFilms.length);
    };

    controls.search.addEventListener("input", updateResults);
    controls.yearMin.addEventListener("input", () => {
      clampYearRange(controls.yearMin, controls.yearMax, controls.yearMin);
      updateResults();
    });
    controls.yearMax.addEventListener("input", () => {
      clampYearRange(controls.yearMin, controls.yearMax, controls.yearMax);
      updateResults();
    });
    for (const select of [
      controls.moralScope,
      controls.victimLevel,
      controls.heroType,
      controls.villainType,
      controls.conflictScale,
    ]) {
      select.addEventListener("change", updateResults);
    }
    updateResults();
  } catch (error) {
    console.error(error);
    showLoadError(container);
  }
}

function renderFilms(container, films) {
  const fragment = document.createDocumentFragment();

  if (films.length === 0) {
    const message = document.createElement("li");
    message.className = "film-list__status";
    message.textContent = "No films found.";
    container.replaceChildren(message);
    return;
  }

  for (const film of films) {
    fragment.append(createFilmItem(film));
  }

  container.replaceChildren(fragment);
}

function createFilmItem(film) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  const title = document.createElement("h2");
  const facts = document.createElement("dl");

  item.className = "film-list__item";
  link.className = "film-list__link";
  link.href = `film.html?id=${encodeURIComponent(film.id)}`;
  title.className = "film-list__title";
  title.textContent = displayValue(film.title);
  facts.className = "film-list__facts";
  facts.append(
    createFilmFact("Year", film.year),
    createFilmFact("Worldwide rank", film.rank),
    createFilmFact("Moral scope index", film.moral_scope_index),
  );

  link.append(title, facts);
  item.append(link);
  return item;
}

function createFilmFact(label, value) {
  const fact = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");

  fact.className = "film-list__fact";
  term.textContent = label;
  description.textContent = displayValue(value);
  fact.append(term, description);

  return fact;
}

function displayValue(value) {
  return value ?? "Not available";
}

function showResultCount(element, count) {
  element.textContent = `${count} ${count === 1 ? "film" : "films"}`;
  element.hidden = false;
}

function showLoadError(container) {
  const message = document.createElement("li");
  message.className = "film-list__status film-list__status--error";
  message.setAttribute("role", "alert");
  message.textContent = "The film data could not be loaded. Please try again later.";
  container.replaceChildren(message);
}
