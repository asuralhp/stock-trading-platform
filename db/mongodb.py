from pymongo import MongoClient

# Connect to MongoDB server (default is localhost:27017)
host = 'mongodb://localhost:27017/'
client = MongoClient(host)

# Create or access a database
db = client['hello_world_db']  # Database name

# Create or access a collection
collection = db['greetings']    # Collection name

# Insert a document
hello_document = {"message": "Hello, World!"}
result = collection.insert_one(hello_document)

# Print the inserted document ID
print(f'Document inserted with ID: {result.inserted_id}')

# Retrieve and print the document
retrieved_document = collection.find_one({"_id": result.inserted_id})
print(f'Retrieved document: {retrieved_document}')

# Close the connection
client.close()