import express from 'express';
import cors from 'cors';
import routes from './routes/index.ts';
import { appConfig } from '../config/env.ts';

const app = express();

app.use(cors());
app.use(express.json());

app.use(routes);

if (appConfig.env !== 'test') {
  app.listen(appConfig.port, () => {
    console.log(`Server is running on http://localhost:${appConfig.port}`);
  });
}

export default app;
