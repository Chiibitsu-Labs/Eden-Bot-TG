// webServer.mjs

import express from 'express';

const app = express();
const port = process.env.PORT || 3000; // PORT environment variable or 3000 as default

app.get('/', (req, res) => {
  res.status(200).send('Bot is running!');
});

app.get('/ping', (req, res) => {
  res.status(200).send('Pong!');
});

export const startWebServer = () => {
  app.listen(port, () => {
    console.log(`Web server listening at http://localhost:${port}`);
  });
};
