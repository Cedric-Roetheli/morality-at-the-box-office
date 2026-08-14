# Morality at the Box Office

Interactive website accompanying the bachelor thesis:

**Morality at the Box Office: A Narrative Economics Analysis, 1977–2025**

The project explores how the narrative structure of the 20 highest-grossing films worldwide changed between 1977 and 2025.

The website contains:
- an overview of the main trends
- interactive visualisations
- a searchable explorer covering 980 films
- individual film views
- the full bachelor thesis PDF

## Project structure

Planned structure:

- `index.html` — homepage
- `trends.html` — trend visualisations
- `explore.html` — film explorer
- `film.html` — individual film view
- `paper.html` — bachelor thesis
- `css/` — styles
- `js/` — frontend JavaScript
- `data/` — processed website data
- `source_data/` — original research dataset
- `scripts/` — Python data preparation
- `paper/` — thesis PDF

## Technology

The project intentionally uses a simple static architecture:

- HTML
- CSS
- vanilla JavaScript
- Python/pandas for preprocessing
- GitHub Pages for hosting

No backend or database is required.

## Development

For a local preview, run:

```bash
python -m http.server 8000
