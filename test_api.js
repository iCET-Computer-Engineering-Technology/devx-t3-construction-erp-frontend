const http = require('http');

const data = JSON.stringify({
  project_name: "Test Project",
  location: "Test Location",
  start_date: 1712448000000,
  estimated_end_date: 1715040000000,
  status: "ACTIVE",
  project_manager_id: 1,
  total_budget: 50000
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 8080,
    path: '/projects/addProject',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  },
  res => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`BODY: ${body}`);
    });
  }
);
req.on('error', console.error);
req.write(data);
req.end();
