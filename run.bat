@echo off
type nul > output.xlsx
docker build -t wm-data .
docker run -v "%cd%\addresses.csv:/usr/src/app/addresses.csv" -v "%cd%\output.xlsx:/usr/src/app/output.xlsx" wm-data
pause