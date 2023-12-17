const express = require('express');

const app = express();
const port1 = 8080;
const port2 = 8081;

// Define a route handler
app.get('/', (req, res) => {
  res.send(`Hello, this server is running on ports ${port1} and ${port2}!\n`);
});

// Create servers for different ports
app.listen(port1, () => {
  console.log(`Server 1 is listening on port ${port1}`);
});

app.listen(port2, () => {
  console.log(`Server 2 is listening on port ${port2}`);
});

// Example: Change ports after 5 seconds
// setTimeout(() => {
//   server1.close(() => {
//     console.log(`Server 1 is closed. Changing to port 3000`);
//     const newServer1 = app.listen(3000, () => {
//       console.log(`Server 1 is listening on port 3000`);
//     });

//     // Update the server reference
//     server1 = newServer1;
//   });

//   server2.close(() => {
//     console.log(`Server 2 is closed. Changing to port 3001`);
//     const newServer2 = app.listen(3001, () => {
//       console.log(`Server 2 is listening on port 3001`);
//     });

//     // Update the server reference
//     server2 = newServer2;
//   });
// }, 5000);
