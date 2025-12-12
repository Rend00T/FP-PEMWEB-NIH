const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello World' }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on Port ${port} 💫`);
});