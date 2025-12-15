
const net = require('net');

console.log("Testing 127.0.0.1...");
const client = net.createConnection({ port: 8000, host: '127.0.0.1' }, () => {
  console.log('SUCCESS: Connected to 127.0.0.1:8000');
  client.end();
});
client.on('error', (err) => {
  console.log('FAIL 127.0.0.1:', err.message);
});

console.log("Testing localhost...");
const client2 = net.createConnection({ port: 8000, host: 'localhost' }, () => {
    console.log('SUCCESS: Connected to localhost:8000');
    client2.end();
  });
  client2.on('error', (err) => {
    console.log('FAIL localhost:', err.message);
  });
