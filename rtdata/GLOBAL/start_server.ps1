# Define the path to the MongoDB executable
$mongodbPath = "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"
$mongocompassPath = "C:\Users\Lau\AppData\Local\MongoDBCompass\MongoDBCompass.exe"
# Define the arguments
$arguments = "--port 27017"

# Start the process with the executable and arguments
Start-Process -FilePath $mongodbPath -ArgumentList $arguments
Start-Process -FilePath $mongocompassPath
