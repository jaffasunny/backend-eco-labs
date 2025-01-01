import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { TCorsOptions } from './types/index.js';
import { seedSuperAdmin } from './utils/seeder.js';

const corsOptions: TCorsOptions = {
  origin: process.env.CORS_ORIGIN as string,
  credentials: true,
};

const app = express();

app.use(cors(corsOptions));

app.use(
  express.json({
    limit: '16kb',
  })
);

app.use(express.urlencoded({ extended: true, limit: '16kb' }));

app.use(express.static('public'));

app.use(cookieParser());

// routes import
import userRouter from './routes/user.route.js';
import landownerRouter from './routes/landowner.route.js';
import researcherRouter from './routes/researcher.route.js';
import reportsRouter from './routes/report.route.js';

// routes declaration
app.get('/', (req, res) => {
  return res
    .status(200)
    .send(
      '<h1>Testing cicd: Welcome to intial route for Backend Bits of Code...</h1>'
    );
});

// auth routes
app.use('/api/v1/users', userRouter);

// landowner routes
app.use('/api/v1/landowners', landownerRouter);

// researcher routes
app.use('/api/v1/researchers', researcherRouter);

// researcher routes
app.use('/api/v1/reports', reportsRouter);

export { app };
