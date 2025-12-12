const express = require('express');

const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Hello World' });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on Port ${port} 💫`);
});