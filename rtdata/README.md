# PQQQQ
- [PQQQQ](#pqqqq)
  - [Notes](#notes)
  - [Start](#start)
  - [Installation](#installation)
  - [Old Example](#old-example)
  - [PIP](#pip)
  - [Abbr.](#abbr)
  - [Notes](#notes-1)

## Notes
- [ ] grouping 5 sec to 1 min
- [ ] LGTM stack
- [ ] ti min 1 (failed, use grafana instead)
- [x] sqlite -> mongodb ?
- [x] poll last 5 5 sec ticks sma_3
- [x] to csv
- [x] realtime sec_5
- [x] change paper base currency 
- [x] install twsapi
 
## Start
- python -m venv .venv
- .\GLOBAL\start_server.ps1
- Login TWS
- python -m main


## Installation

- https://ibkrcampus.com/campus/ibkr-api-page/twsapi-doc/#windows-install
- https://interactivebrokers.github.io/#
- py -m venv .venv
- .\.venv\Scripts\activate    
- pip install setuptools
- cd "C:\TWS API\source\pythonclient"
- py setup.py install
- back to working directory

## Old Example
`C:\Users\Lau\Documents\CODE\IBKR\AsuraQuant\poc`

## PIP
```
pip install -U pip
pip install -U pymongo
pip install -U pandas
pip install -U requests
```

## Abbr.

rt - realtime
ts - timeseries
agg - aggregate 

## Notes

- python -m db.ts_webhook