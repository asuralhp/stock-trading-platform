# Define the path to the MongoDB executable
$mongodbPath = "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"

# Define the arguments
$arguments = "--port 27017"

# Start the process with the executable and arguments
Start-Process -FilePath $mongodbPath -ArgumentList $arguments