import express from 'express';

const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Hello World' });
});

const port = 4000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on Port ${port} 💫`);
});