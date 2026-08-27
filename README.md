# Morality at the Box Office

An interactive website based on the bachelor thesis *Morality at the Box Office: A Narrative Economics Analysis, 1977–2025*. The project examines the narrative structure of 980 films: the top 20 worldwide-grossing films in each year from 1977 through 2025.

## Website sections

- **Home** — introduces the research question and narrative measures.
- **Trends** — presents four interactive trend charts.
- **Explore** — provides a searchable and filterable film explorer.
- **Film detail pages** — show each film's narrative roles, scores, and Hero–Villain–Victim triangle.
- **Paper** — links to the final public bachelor thesis PDF.

## Current functionality

- Searchable film explorer
- Year-range filtering
- Multi-select narrative filters
- Individual film narrative views
- Hero–Villain–Victim triangle
- Four interactive trend charts
- Filtered trend comparisons against the same-period baseline

## Technology

- HTML
- CSS
- Vanilla JavaScript
- Python and pandas for data preprocessing
- JSON website data
- GitHub Pages as the intended hosting platform

No backend, database, framework, or build step is required.

## Project structure

- `index.html`, `trends.html`, `explore.html`, `film.html`, `paper.html` — website pages
- `css/style.css` — shared site and responsive styles
- `js/` — film explorer, film detail, filtering, and trend-chart logic
- `data/films.json` — processed film data loaded by the website
- `source_data/` — source research CSV
- `scripts/prepare_data.py` — CSV-to-JSON preprocessing script
- `paper/` — public thesis PDF
- `requirements.txt` — pinned Python preprocessing dependencies

## Thesis and replication

The Paper page links to the final public thesis PDF at `paper/Roetheli_BA_2026_public.pdf`.

The analysis pipeline and replication code are available in the [boxoffice-analysis-pipeline repository](https://github.com/Cedric-Roetheli/boxoffice-analysis-pipeline).

## Local development

From the repository root, start a local static server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Use a Python virtual environment for data preparation. The required packages and versions are documented in `requirements.txt` and can be installed with:

```bash
python -m pip install -r requirements.txt
```

## Data preparation

Regenerate `data/films.json` from the source CSV with:

```bash
python scripts/prepare_data.py
```

The script validates the source fields, creates stable film IDs, sorts the records, and writes the website JSON without modifying the source CSV.
