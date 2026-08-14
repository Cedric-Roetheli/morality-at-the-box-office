from pathlib import Path
import re
import unicodedata

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
INPUT_PATH = (
    ROOT_DIR
    / "source_data"
    / "master_films_stage4_narrative_with_subtitles_gpt54__analysis_ready.csv"
)
OUTPUT_PATH = ROOT_DIR / "data" / "films.json"

SOURCE_COLUMNS = [
    "year",
    "rank",
    "title",
    "tmdb_id",
    "imdb_id_tmdb",
    "worldwide_gross",
    "domestic_gross",
    "foreign_gross",
    "domestic_pct",
    "foreign_pct",
    "hero_name",
    "hero_actor",
    "villain_name",
    "villain_actor",
    "victim_name",
    "victim_level",
    "hero_victim_distance",
    "conflict_scale",
    "moral_scope_index",
    "confidence",
]

INTEGER_COLUMNS = [
    "year",
    "rank",
    "tmdb_id",
    "worldwide_gross",
    "domestic_gross",
    "foreign_gross",
    "victim_level",
    "hero_victim_distance",
    "conflict_scale",
    "moral_scope_index",
]

NUMERIC_COLUMNS = [
    "domestic_pct",
    "foreign_pct",
]


def make_film_id(title: str, year: int) -> str:
    if pd.isna(title) or pd.isna(year):
        raise ValueError("Every film must have a title and year to create an ID.")

    normalized_title = unicodedata.normalize("NFKD", str(title))
    ascii_title = normalized_title.encode("ascii", "ignore").decode("ascii")
    title_slug = re.sub(r"[^a-z0-9]+", "-", ascii_title.lower()).strip("-")

    if not title_slug:
        raise ValueError(f"Could not create a URL-friendly ID for title: {title!r}")

    return f"{title_slug}-{int(year)}"


def validate_columns(films: pd.DataFrame) -> None:
    missing_columns = [column for column in SOURCE_COLUMNS if column not in films]
    if missing_columns:
        missing_list = ", ".join(missing_columns)
        raise ValueError(f"Source CSV is missing required columns: {missing_list}")


def validate_unique_ids(films: pd.DataFrame) -> None:
    duplicate_ids = films.loc[films["id"].duplicated(keep=False), "id"].unique()
    if len(duplicate_ids) > 0:
        duplicate_list = ", ".join(sorted(duplicate_ids))
        raise ValueError(f"Duplicate film IDs found: {duplicate_list}")


def prepare_films() -> pd.DataFrame:
    films = pd.read_csv(INPUT_PATH, keep_default_na=False, na_values=[""])
    validate_columns(films)
    films = films[SOURCE_COLUMNS].copy()

    for column in INTEGER_COLUMNS:
        films[column] = pd.to_numeric(films[column], errors="raise").astype("Int64")

    for column in NUMERIC_COLUMNS:
        films[column] = pd.to_numeric(films[column], errors="raise")

    films.insert(
        0,
        "id",
        [make_film_id(title, year) for title, year in zip(films["title"], films["year"])],
    )
    validate_unique_ids(films)

    return films.sort_values(["year", "rank"], kind="stable").reset_index(drop=True)


def main() -> None:
    films = prepare_films()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    films.to_json(OUTPUT_PATH, orient="records", indent=2, force_ascii=False)

    print(f"Films exported: {len(films)}")
    print(f"Output path: {OUTPUT_PATH.relative_to(ROOT_DIR)}")
    print(f"All IDs unique: {films['id'].is_unique}")


if __name__ == "__main__":
    main()
