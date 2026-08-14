"use strict";

window.FilmFilterUtils = (() => {
  const actorCategoryLabels = {
    individual_civilian: "Individual civilian",
    collective_civilian: "Civilian collective",
    state_military: "State / military",
    corporate_institutional: "Corporate / institutional",
    non_human: "Non-human",
    none: "None / unclear",
  };

  function actorCategoryLabel(category) {
    return actorCategoryLabels[category] ?? category.replaceAll("_", " ");
  }

  function getActorCategories(films, field) {
    return [...new Set(films.map((film) => film[field]).filter(Boolean))]
      .sort((first, second) => actorCategoryLabel(first).localeCompare(actorCategoryLabel(second)));
  }

  function populateActorOptions(select, films, field) {
    const categories = getActorCategories(films, field);
    const fragment = document.createDocumentFragment();

    for (const category of categories) {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = actorCategoryLabel(category);
      fragment.append(option);
    }

    select.append(fragment);
  }

  function clampYearRange(minInput, maxInput, changedInput) {
    if (Number(minInput.value) <= Number(maxInput.value)) {
      return;
    }

    if (changedInput === minInput) {
      minInput.value = maxInput.value;
    } else {
      maxInput.value = minInput.value;
    }
  }

  function filterFilms(films, filters) {
    const filmsInRange = filterFilmsByYear(films, filters.yearMin, filters.yearMax);
    return filterFilmsByContent(filmsInRange, filters);
  }

  function filterFilmsByYear(films, minimumYear, maximumYear) {
    return films.filter((film) => matchesYearRange(film.year, minimumYear, maximumYear));
  }

  function filterFilmsByContent(films, filters) {
    const normalizedSearch = (filters.searchTerm ?? "").trim().toLocaleLowerCase();

    return films.filter((film) => {
      const matchesTitle = normalizedSearch === ""
        || (typeof film.title === "string" && film.title.toLocaleLowerCase().includes(normalizedSearch));

      return matchesTitle
        && matchesFilter(film.moral_scope_index, filters.moralScope)
        && matchesFilter(film.victim_level, filters.victimLevel)
        && matchesFilter(film.hero_actor, filters.heroType)
        && matchesFilter(film.villain_actor, filters.villainType)
        && matchesFilter(film.conflict_scale, filters.conflictScale);
    });
  }

  function matchesYearRange(year, minimumYear, maximumYear) {
    return year !== null && year !== undefined && year >= minimumYear && year <= maximumYear;
  }

  function matchesFilter(value, selection) {
    let selectedValues = [];

    if (Array.isArray(selection)) {
      selectedValues = selection.map(String);
    } else if (selection !== "" && selection !== null && selection !== undefined) {
      selectedValues = [String(selection)];
    }

    return selectedValues.length === 0
      || (value !== null && value !== undefined && selectedValues.includes(String(value)));
  }

  return Object.freeze({
    actorCategoryLabel,
    clampYearRange,
    filterFilms,
    filterFilmsByContent,
    filterFilmsByYear,
    getActorCategories,
    populateActorOptions,
  });
})();
