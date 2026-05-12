import express from 'express';
import cors from 'cors';
import subjectsRouter from './routes/subjects.js';
import securityMiddleware from './middleware/security.js';

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) {
  throw new Error('FRONTEND_URL is not defined in environment variables');
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }),
);

app.use(express.json());
app.use(securityMiddleware);
app.use('/api/subjects', subjectsRouter);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
