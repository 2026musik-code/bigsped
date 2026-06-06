import http from 'https';
import fs from 'fs';

http.get('https://raw.githubusercontent.com/2026musik-code/serversped/nautica-luxury-worker-13214256715426635711/src/worker.js', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('worker.js', data);
    console.log('done worker.js');
  });
});
http.get('https://raw.githubusercontent.com/2026musik-code/serversped/nautica-luxury-worker-13214256715426635711/src/html.js', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('html.js', data);
    console.log('done html.js');
  });
});
