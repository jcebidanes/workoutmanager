import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import routes from './routes/index.ts';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use(routes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

