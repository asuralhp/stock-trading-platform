# download for all tickers
$url= "https://www.sec.gov/files/company_tickers.json"
$destination = "./"
Invoke-WebRequest -Uri $url -OutFile $destination