# Toxic Ground

[Open Toxic Ground](https://coolcode.ca/toxic-ground/)

Trace the investigation of a recorded site. Compare its contaminants, annual expenditures and highest completed management step across fiscal years.

<!-- coolcode:guide -->
Search Halifax for Willow Park (4327) - TEME North Site. Its fiscal rows let you compare remediation spending with the highest completed step. Use the federal site ID to revisit the same entry after a source update.
<!-- /coolcode:guide -->

## Using the records

The unit is one federal site ID. Search names, municipalities, IDs, contaminants or media. The fiscal table preserves each reporting organization, its four total expenditure categories and its reported highest completed step. Amounts are reported CAD, summed across observations with at least one numeric value. The narrower FCSAP program funding columns are never added to these totals. Dashes denote missing fields. Site classification and inventory status are different fields. Use the consecutive-years filter to find the latest step repeated in five or more consecutive fiscal years. The count stops at a gap, missing step, conflicting steps in the same year, or a change. A repeat step is an annual observation and does not establish that work stopped. Search a property number to find linked DFRP parcels if available.

Search, filter and download every matching record. Selecting a result exposes a shareable record URL. The local Natural Earth backdrop and zoomable point groups work from the deployed files. The optional street-map switch requests tiles from OpenStreetMap. Sources without coordinates still appear in the list and export.

## Sources and verification

- [Federal Contaminated Sites Inventory](https://open.canada.ca/data/en/dataset/1d42f7b9-1549-40aa-8ac6-0e0302ff2902)

Contains information licensed under the [Open Government Licence – Canada](https://open.canada.ca/en/open-government-licence-canada). Province and state outlines derive from the [Natural Earth 1:50m admin-1 with lakes](https://www.naturalearthdata.com/) public-domain dataset. The bundled [Leaflet](https://leafletjs.com/) license is in web/vendor/LICENSE. The street layer contains © OpenStreetMap contributors.

The site derives dates and counts from each successfully retrieved edition. A weekly GitHub Actions job fetches and validates the source files, checks the app and commits the resulting snapshot. A failed refresh leaves the last working deployment available. The static build expands checked-in regional gzip files. No registration or API key is required.

Run `python scripts/refresh.py` to retrieve sources, `python -m unittest discover -s tests` and `node --test tests/*.test.mjs` for validation, and `python scripts/build.py` to build the site. For local preview run `python -m http.server --directory dist`.

<!-- schedule-reliability -->
## Schedule reliability

Public GitHub repositories can have scheduled workflows disabled after 60 days of inactivity. A separate weekly [schedule guard](.github/workflows/schedule-guard.yml) calls GitHub's enable-workflow API for an explicit list of refresh workflows and itself. It can restore workflows disabled for inactivity, preserves manually disabled workflows, and runs independently of collection failures.

The separate schedule guard remains a mitigation, not a scheduling guarantee. The independent [CoolCode refresh watchdog](https://github.com/jsdyer/jsdyer.github.io/blob/main/services/refresh-watchdog/README.md) is maintained in GitHub and uses the generated workflow and freshness registry; do not maintain another target list here. Using it requires installation on a Linux server and GitHub credentials with access to this repository. A generated target does not prove that a private server has adopted it; verify the installed service's report. The guard does not collect data, create dummy commits or change source/check timestamps. Successful collection and published data freshness still need monitoring.
<!-- /schedule-reliability -->
