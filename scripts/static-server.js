const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const ROOT = '/home/allfa/git-projects/static_blog/out';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

function serve(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Handle trailing slashes - try directory index.html
  if (filePath.endsWith('/')) {
    filePath = filePath + 'index.html';
  } else if (!path.extname(filePath)) {
    // No extension - try as directory
    filePath = path.join(filePath, 'index.html');
  }
  
  filePath = path.join(ROOT, filePath);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try index.html for directories
        const indexPath = path.join(filePath, 'index.html');
        fs.readFile(indexPath, (err2, content2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(serve);
server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}/`);
});