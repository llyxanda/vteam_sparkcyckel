import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import { graphqlHTTP } from 'express-graphql';
//import { createHandler } from 'graphql-http/lib/use/express';
//import { buildSchema } from 'graphql';
import posts from './routes/posts.mjs';
//import schemaAuth from './graphql/authtypes.mjs';
import graphqlSchema from './graphql/authtypes.mjs';
import graphqlSchemaU from './graphql/usertypes.mjs';
import scooterSchema from './graphql/scootertypes.mjs';
import tripSchema from './graphql/triptypes.mjs';
import http from "http";
import {loggingMiddleware, authMiddleware, attachUserMiddleware} from "./middlewares/authMiddleware.mjs"
import { initializeSockets } from './websockets/socketConfig.mjs';

const app = express();
const port = process.env.PORT || 8080;
const httpServer = http.createServer(app);

initializeSockets(httpServer); 
app.use(express.static(path.join(process.cwd(), "public")));
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/", async (req, res) => {
  //await docs.deleteAll('documents');
  res.render('index', {
    title: 'API Documentation',
    routes: [
      { method: 'GET', path: '/', description: 'API Documentation' },
      { method: 'GET', path: '/posts/oauth', description: 'Oauth authorisation with google' },
      { method: 'GET', path: '/graphql/auth', description: 'Manual authorisation with graphql' },
      { method: 'GET/POST', path: '/graphql/users', description: 'Users database graphql' },
      { method: 'GET/POST', path: '/graphql/scooters', description: 'Scooters database graphql' },
      { method: 'GET/POST', path: '/graphql/trips', description: 'Trips database graphql' },
    ]
  });
});


//const schemaAuthmiddleware = buildSchema(`
//  type Query {
//    ip: String
//    userData: String
//  }
//`);

//const root = {
//  ip: (args, context) => context.ip,
//  userData: (args, context) => context.user ? `Authenticated user email: ${context.user.email}` : "No authenticated user"
//};


//app.all("/graphql", createHandler({
//  schema: schemaAuthmiddleware,
//  rootValue: root,
//  context: req => ({
//    ip: req.raw.ip,
//    user: req.raw.user
//  }),
//}));

app.disable('x-powered-by');
app.set("view engine", "ejs");

app.use("/posts", posts);
app.use('/graphql/auth', graphqlHTTP({
  schema: graphqlSchema,
  graphiql: true,
}));

app.use(loggingMiddleware);
app.use(authMiddleware);
app.use(attachUserMiddleware);

app.use('/graphql/users', graphqlHTTP({
  schema: graphqlSchemaU,
  graphiql: false,
}));

app.use('/graphql/scooters', graphqlHTTP({
  schema: scooterSchema,
  graphiql: false,
}));

app.use('/graphql/trips', graphqlHTTP({
  schema: tripSchema,
  graphiql: false,
}));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

const server = httpServer.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

export default server;
