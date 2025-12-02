from main import query_collection, batch_process
import GLOVAR
from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.parse

class MyHandler(SimpleHTTPRequestHandler):

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_path.query)
        if self.path == '/':
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"Here is Chroma RAG!")
        
        elif parsed_path.path == '/retrieve':
            question = query_params.get('question', ['Give me guides'])[0]
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()

            result = query_collection(question,4)

            print("Query result:", result['documents'][0])  

            self.wfile.write(b"\n".join([doc.encode('utf-8') for doc in result['documents'][0]])) # Corrected line
        
        elif self.path == '/rerun':
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            batch_process(GLOVAR.PATH_DOCUMENTS)
            self.wfile.write(b"Texts have been processed and stored in Chroma!")
        
        else:
            self.send_response(404)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"<html><body><h1>404 Not Found</h1></body></html>")

def run(server_class=HTTPServer, handler_class=MyHandler):
    server_address = ('', GLOVAR.PORT_SERVER)  # Serve on all interfaces
    httpd = server_class(server_address, handler_class)
    print(f"Starting server on port {GLOVAR.PORT_SERVER}...")
    httpd.serve_forever()

if __name__ == "__main__":
    run()