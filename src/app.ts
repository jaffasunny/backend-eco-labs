import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { TCorsOptions } from './types';
import { seedSuperAdmin } from './utils/seeder';

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
import userRouter from './routes/user.route';
import landownerRouter from './routes/landowner.route';

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

export { app };
