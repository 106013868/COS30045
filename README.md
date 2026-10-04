# Healthcare Spending and Life Expectancy

COS30045 Data Visualisation, Assignment 3. Team 02B.

An interactive D3 visualisation comparing healthcare spending per person with life expectancy at birth across 50 countries from 2011 to 2022, with Australia highlighted as a reference point.

- **Live site (Mercury):** https://mercury.swin.edu.au/cos30045/s106013868/a3/
- **Repository:** https://github.com/106013868/COS30045

## Features

- Scatterplot of spending per person (x) against life expectancy (y), one dot per country
- Year slider (2011 to 2022) with animated transitions
- Region filtering
- Tooltip with country, spending and life expectancy on hover
- Average lines for both measures, recalculated for the countries currently shown
- History trails showing each country's path over time, individually or all at once

## Folder structure

```
index.html              Main page
scripts/scatter.js      D3 scatterplot and interactions
styles/style.css        Site styling
data/
  raw/                  Raw OECD exports
  health_data.csv       Processed data loaded by the chart
processing/
  prepare_data.py       Merges and cleans the raw exports
  requirements.txt      Python dependencies
```

## Data

Both datasets come from OECD Health Statistics via the OECD Data Explorer.

**Health expenditure and financing** (`DSD_SHA@DF_SHA`), saved as `data/raw/spending.csv`
Measure: Expenditure. Unit: US dollars per person, PPP converted. Price base: Current prices. Financing scheme, function, provider and mode of provision: Total.
Original export: `OECD_ELS_HD_DSD_SHA_DF_SHA__filtered_2026-09-20_04-42-58.csv`

**Life expectancy** (`DSD_HEALTH_STAT@DF_LE`), saved as `data/raw/life.csv`
Measure: Life expectancy. Age: At birth. Sex: Total.
Original export: `OECD_ELS_HD_DSD_HEALTH_STAT_DF_LE_1_0_filtered_2026-09-20_04-44-47.csv`

## Data processing

`processing/prepare_data.py` produces `data/health_data.csv` from the raw exports. It:

1. Keeps only the country code, country name, year and value from each export
2. Joins the two datasets on country code and year using an inner join, so only records with both values are kept
3. Restricts the data to 2011 to 2022, the years in which all 50 countries report both indicators
4. Adds a region for each country, used by the region filter
5. Rounds spending to whole dollars and life expectancy to one decimal place

Output columns: `country`, `code`, `region`, `year`, `spending`, `life_expectancy`. The result has 599 records across 50 countries.

To regenerate it:

```
pip install pandas
python processing/prepare_data.py
```

## Built with

- [D3.js v7](https://d3js.org/)
- Python with pandas, for data preparation only