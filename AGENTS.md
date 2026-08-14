# AGENTS.md

## Project purpose

This repository contains a static interactive website based on the bachelor thesis
"Morality at the Box Office: A Narrative Economics Analysis, 1977–2025".

The website is a public-facing data exploration project, not a reproduction of the thesis.

The main goals are:
- present the main trends visually
- allow users to explore the 980 films in the dataset
- provide individual film detail views
- provide access to the full bachelor thesis PDF

## Technical principles

Keep the project deliberately simple.

Use:
- plain HTML
- plain CSS
- vanilla JavaScript
- JSON for website data
- Python/pandas for data preprocessing
- GitHub Pages for hosting

Do not introduce unless explicitly requested:
- React
- Vue
- Next.js
- TypeScript
- Node.js backends
- databases
- server-side frameworks
- npm build systems
- unnecessary dependencies

The website should work as a static GitHub Pages site.

## Architecture

Data processing belongs in Python.

Frontend code should primarily:
- load prepared JSON data
- filter and sort films
- render views
- handle user interaction
- render charts

Do not perform complex data preprocessing in JavaScript if it can be prepared in Python.

## Design direction

The visual style should be:
- editorial
- cinematic
- data-journalism inspired
- restrained
- clean
- highly readable
- modern but not trendy for its own sake

Avoid:
- Hollywood clichés
- film reels
- popcorn imagery
- red curtains
- gold-star aesthetics
- excessive gradients
- flashy animations
- emojis
- decorative clutter

The data should be the main visual focus.

## Scope

Initial navigation:
- Home
- Trends
- Explore
- Paper

There is no Methodology page.

Methodological details should not be added to the website unless explicitly requested.
The full bachelor thesis PDF is the source for users who want methodological detail.

## Coding style

Prefer:
- small readable files
- semantic HTML
- clear variable names
- short functions
- comments only where they add real value

Avoid:
- clever abstractions
- unnecessary architecture
- hidden magic
- large monolithic JavaScript files

When making changes:
- modify only files relevant to the requested task
- do not refactor unrelated code
- do not introduce new dependencies without explaining why
- preserve existing working behaviour unless asked to change it

## Accessibility and responsiveness

The website must:
- work on desktop and mobile
- use semantic HTML
- maintain sufficient contrast
- support keyboard navigation where relevant
- avoid interactions that depend only on hover

## Development philosophy

Build in small, testable increments.

Do not implement future features unless explicitly requested.

A simple working implementation is preferred over a more sophisticated architecture.
