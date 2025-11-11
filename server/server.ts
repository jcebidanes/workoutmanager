import express from 'express';
import cors from 'cors';
import knex from '../db/db.ts';
import { hashPassword, comparePassword } from '../src/utils/hashPassword.ts';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    await knex('users').insert({ username, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await knex('users').where({ username }).first();
    if (user && await comparePassword(password, user.password)) {
      res.json({ message: 'Login successful', user: { username: user.username } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
