
const net = require('net');
const client = net.createConnection({ port: 8000, host: '127.0.0.1' }, () => {
  console.log('Connected to 127.0.0.1:8000');
  client.end();
});
client.on('error', (err) => {
  console.log('Error 127.0.0.1:', err.message);
});

const client2 = net.createConnection({ port: 8000, host: 'localhost' }, () => {
    console.log('Connected to localhost:8000');
    client2.end();
  });
  client2.on('error', (err) => {
    console.log('Error localhost:', err.message);
  });
