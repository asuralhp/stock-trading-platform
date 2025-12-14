```
python -m venv .venv

pip install chromadb
python server.py 
python -m main
```


```
docker build -t vecdb:latest .
docker run --rm -p 3004:3004 --name vecdb vecdb:latest
```