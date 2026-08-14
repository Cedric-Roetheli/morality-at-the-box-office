"use strict";

const filmDetail = document.querySelector("[data-film-detail]");

if (filmDetail) {
  loadFilm(filmDetail);
}

async function loadFilm(container) {
  const filmId = new URLSearchParams(window.location.search).get("id");

  if (!filmId) {
    showFilmNotFound(container);
    return;
  }

  try {
    const response = await fetch("data/films.json");

    if (!response.ok) {
      throw new Error(`Film data request failed with status ${response.status}.`);
    }

    const films = await response.json();
    const film = films.find((item) => item.id === filmId);

    if (!film) {
      showFilmNotFound(container);
      return;
    }

    renderFilm(container, film);
  } catch (error) {
    console.error(error);
    showLoadError(container);
  }
}

function renderFilm(container, film) {
  const article = document.createElement("article");
  const header = document.createElement("header");
  const heading = document.createElement("div");
  const meta = document.createElement("p");
  const title = document.createElement("h1");
  const sections = document.createElement("div");

  article.className = "film-detail";
  header.className = "film-detail__header";
  heading.className = "film-detail__heading";
  meta.className = "eyebrow";
  meta.textContent = `Year ${displayValue(film.year)} | Worldwide rank ${displayValue(film.rank)}`;
  title.textContent = displayValue(film.title);
  sections.className = "film-detail__sections";
  sections.append(
    createDetailSection("Hero", [
      ["Name", film.hero_name],
      ["Actor", film.hero_actor],
    ]),
    createDetailSection("Villain / Threat", [
      ["Name", film.villain_name],
      ["Actor", film.villain_actor],
    ]),
    createDetailSection("Victim", [
      ["Name", film.victim_name],
      ["Victim level", film.victim_level],
    ]),
    createDetailSection("Narrative scores", [
      ["Moral Scope Index", film.moral_scope_index, "film-detail__fact--primary"],
      ["Hero-victim distance", film.hero_victim_distance],
      ["Conflict scale", film.conflict_scale],
      ["Confidence", film.confidence],
    ]),
  );

  heading.append(meta, title);
  header.append(heading, createNarrativeStructure(film));
  article.append(header, sections);
  container.replaceChildren(article);
  document.title = `${displayValue(film.title)} | Morality at the Box Office`;
}

function createNarrativeStructure(film) {
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  const topVertices = document.createElement("div");
  const triangle = createNarrativeTriangle(film);
  const victim = createNarrativeVertex("Victim", film.victim_name);

  section.className = "narrative-structure";
  heading.textContent = "Narrative structure";
  topVertices.className = "narrative-triangle__top";
  victim.classList.add("narrative-triangle__victim");
  topVertices.append(
    createNarrativeVertex("Hero", film.hero_name),
    createNarrativeVertex("Villain / Threat", film.villain_name),
  );
  section.append(heading, topVertices, triangle, victim);

  return section;
}

function createNarrativeVertex(role, name) {
  const vertex = document.createElement("div");
  const roleLabel = document.createElement("span");
  const nameLabel = document.createElement("strong");

  vertex.className = "narrative-triangle__vertex";
  roleLabel.className = "narrative-triangle__role";
  roleLabel.textContent = role;
  nameLabel.textContent = displayValue(name);
  vertex.append(roleLabel, nameLabel);

  return vertex;
}

function createNarrativeTriangle(film) {
  const svg = createSvgElement("svg");
  const edges = [
    ["narrative-conflict-edge", "M 60 36 L 340 36", "Conflict scale C", film.conflict_scale],
    ["narrative-distance-edge", "M 60 36 L 200 184", "Distance D", film.hero_victim_distance],
    ["narrative-victim-edge", "M 200 184 L 340 36", "Victim scale S", film.victim_level],
  ];

  svg.classList.add("narrative-triangle__svg");
  svg.setAttribute("viewBox", "0 0 400 220");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", createNarrativeDescription(film));

  for (const [id, pathData] of edges) {
    const path = createSvgElement("path");
    path.setAttribute("id", id);
    path.setAttribute("d", pathData);
    path.setAttribute("class", "narrative-triangle__edge");
    svg.append(path);
  }

  for (const [id, , label, value] of edges) {
    const text = createSvgElement("text");
    const textPath = createSvgElement("textPath");
    text.setAttribute("class", "narrative-triangle__edge-label");
    text.setAttribute("dy", "-8");
    textPath.setAttribute("href", `#${id}`);
    textPath.setAttribute("startOffset", "50%");
    textPath.setAttribute("text-anchor", "middle");
    textPath.textContent = formatRelationshipScore(label, value);
    text.append(textPath);
    svg.append(text);
  }

  for (const [cx, cy] of [[60, 36], [340, 36], [200, 184]]) {
    const point = createSvgElement("circle");
    point.setAttribute("cx", cx);
    point.setAttribute("cy", cy);
    point.setAttribute("r", "4");
    point.setAttribute("class", "narrative-triangle__point");
    svg.append(point);
  }

  return svg;
}

function createNarrativeDescription(film) {
  return [
    `Hero: ${displayValue(film.hero_name)}.`,
    `Villain or threat: ${displayValue(film.villain_name)}.`,
    `Victim: ${displayValue(film.victim_name)}.`,
    `${formatRelationshipScore("Distance D", film.hero_victim_distance)}.`,
    `${formatRelationshipScore("Victim scale S", film.victim_level)}.`,
    `${formatRelationshipScore("Conflict scale C", film.conflict_scale)}.`,
  ].join(" ");
}

function formatRelationshipScore(label, value) {
  const displayedValue = displayValue(value);
  const score = displayedValue === "Not available" ? displayedValue : `${displayedValue}/3`;
  return `${label}: ${score}`;
}

function createSvgElement(tagName) {
  return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function createDetailSection(heading, fields) {
  const section = document.createElement("section");
  const title = document.createElement("h2");
  const facts = document.createElement("dl");

  section.className = "film-detail__section";
  title.textContent = heading;
  facts.className = "film-detail__facts";

  for (const [label, value, className] of fields) {
    facts.append(createDetailFact(label, value, className));
  }

  section.append(title, facts);
  return section;
}

function createDetailFact(label, value, className) {
  const fact = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");

  fact.className = className ? `film-detail__fact ${className}` : "film-detail__fact";
  term.textContent = label;
  description.textContent = displayValue(value);
  fact.append(term, description);

  return fact;
}

function displayValue(value) {
  if (value === null || value === undefined || value === "" || Number.isNaN(value)) {
    return "Not available";
  }

  return value;
}

function showFilmNotFound(container) {
  showStatus(container, "Film not found.");
}

function showLoadError(container) {
  showStatus(container, "The film data could not be loaded. Please try again later.");
}

function showStatus(container, text) {
  const message = document.createElement("p");
  message.className = "film-detail__status";
  message.setAttribute("role", "alert");
  message.textContent = text;
  container.replaceChildren(message);
}
