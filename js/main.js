"use strict";

const filmList = document.querySelector("[data-film-list]");

if (filmList) {
  loadFilms(filmList);
}

async function loadFilms(container) {
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
    renderFilms(container, films);
  } catch (error) {
    console.error(error);
    showLoadError(container);
  }
}

function renderFilms(container, films) {
  const list = document.createElement("ul");
  const fragment = document.createDocumentFragment();
  list.className = "film-list";

  for (const film of films) {
    fragment.append(createFilmItem(film));
  }

  list.append(fragment);
  container.replaceWith(list);
}

function createFilmItem(film) {
  const item = document.createElement("li");
  const title = document.createElement("h2");
  const facts = document.createElement("dl");

  item.className = "film-list__item";
  title.className = "film-list__title";
  title.textContent = displayValue(film.title);
  facts.className = "film-list__facts";
  facts.append(
    createFilmFact("Year", film.year),
    createFilmFact("Worldwide rank", film.rank),
    createFilmFact("Moral scope index", film.moral_scope_index),
  );

  item.append(title, facts);
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

function showLoadError(container) {
  const message = document.createElement("p");
  message.className = "film-list__status film-list__status--error";
  message.setAttribute("role", "alert");
  message.textContent = "The film data could not be loaded. Please try again later.";
  container.replaceChildren(message);
}
