import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { TCorsOptions } from './types/index.js';
import helmet from 'helmet';
import { seedSuperAdmin } from './utils/seeder.js';
import { loggerEnvironment } from './utils/utils.js';

const corsOptions: TCorsOptions = {
  origin: process.env.CORS_ORIGIN as string,
  credentials: true,
};

const app = express();

// Use Helmet!
app.use(helmet());

// setting up morgan
loggerEnvironment(app);

app.use(cors(corsOptions));

app.use(
  express.json({
    limit: '16kb',
  })
);

app.use(express.urlencoded({ extended: true, limit: '16kb' }));

app.use(express.static('public'));

app.use(cookieParser());

import routes from './routes/index.js';

// routes declaration
app.get('/', (req, res) => {
  return res
    .status(200)
    .send(
      '<h1>Testing cicd: Welcome to intial route for Backend Eco Labs...</h1>'
    );
});

app.use('/api/v1', routes);

export { app };
