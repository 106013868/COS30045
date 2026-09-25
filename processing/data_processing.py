# Merges the two OECD Health Statistics exports into a single CSV

# Inputs:
#     data/raw/spending.csv
#     data/raw/life.csv

# Output:
#     data/health_data.csv - country, code, year, spending, life_expectancy

import pandas as pd
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(BASE, "data", "raw")
OUT = os.path.join(BASE, "data", "health_data.csv")
START_YEAR = 2011
END_YEAR = 2022


def load(filename, value_name):
    df = pd.read_csv(os.path.join(RAW, filename))
    df = df[["REF_AREA", "Reference area", "TIME_PERIOD", "OBS_VALUE"]]
    df.columns = ["code", "country", "year", value_name]
    return df


spending = load("spending.csv", "spending")
life = load("life.csv", "life_expectancy")

print("spending rows:", len(spending))
print("life expectancy rows:", len(life))

merged = pd.merge(
    spending,
    life[["code", "year", "life_expectancy"]],
    on=["code", "year"],
    how="inner"
)

print("matched country-year pairs:", len(merged))

# Restrict to the usable year range
merged = merged[(merged["year"] >= START_YEAR) & (merged["year"] <= END_YEAR)]

# Drop any row missing either value
before = len(merged)
merged = merged.dropna(subset=["spending", "life_expectancy"])
print("rows dropped for missing values:", before - len(merged))

# Round spending to whole dollars, life expectancy to one decimal
merged["spending"] = merged["spending"].round(0).astype(int)
merged["life_expectancy"] = merged["life_expectancy"].round(1)

merged = merged[["country", "code", "year", "spending", "life_expectancy"]]
merged = merged.sort_values(["country", "year"])

os.makedirs(os.path.dirname(OUT), exist_ok=True)
merged.to_csv(OUT, index=False)

print("\nwrote to", OUT)
print("rows:", len(merged))
print("countries:", merged["code"].nunique())