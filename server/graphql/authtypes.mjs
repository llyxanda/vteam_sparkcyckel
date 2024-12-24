import { SchemaComposer } from 'graphql-compose';
import { composeWithMongoose } from 'graphql-compose-mongoose';
import { GraphQLString} from 'graphql';
import auth from '../datamodels/auth.mjs';
import UserModel from '../datamodels/user.mjs';
import database from '../db/database.mjs';

await database.connectMongoose();

// Initialize SchemaComposer
const schemaComposer = new SchemaComposer();
const AuthUserTypeComposer = composeWithMongoose(UserModel, { name: 'AuthUser' });


schemaComposer.createObjectTC({
    name: 'RegisterResponse',
    fields: {
      message: { type: GraphQLString },
      user: { type: AuthUserTypeComposer.getType() },
    },
  });
  
  schemaComposer.createObjectTC({
    name: 'LoginResponse',
    fields: {
      message: { type: GraphQLString },
      user: { type: AuthUserTypeComposer.getType() },
      token: { type: GraphQLString },
    },
  });
schemaComposer.Query.addFields({
  getUserData: {
    type: AuthUserTypeComposer.getType(),
    resolve: () => {
      return { email: 'user@example.com', admin: true, amount: 100 };
    },
  },
});

schemaComposer.Mutation.addFields({
  register: {
    type: 'RegisterResponse',
    args: {
      email: 'String',
      password: 'String',
      admin: 'Boolean',
      name: 'String',
      surname: 'String',
      amount: 'Float',
    },
    resolve: async (_, { email, password, admin = false, name, surname, amount = 0 }) => {
      const response = await auth.register({ email, password, admin, name, surname, amount });
      if (response.errors) {
        return {
          message: response.errors.detail,
          user: null,
        };
      }
      return response.data;
    },
  },
  login: {
    type: 'LoginResponse',
    args: {
      email: 'String',
      password: 'String',
      admin: 'Boolean',
    },
    resolve: async (_, { email, password, admin = false }) => {
      const response = await auth.login({ email, password, admin });
      if (response.errors) {
        return {
          message: response.errors.detail || 'Login failed',
          user: null,
          token: null,
        };
      }
      if (response.data) {
        return {
          message: response.data.message,
          user: {
            email: response.data.user.user,
            admin: response.data.user.admin,
            amount: response.data.user.amount,
          },
          token: response.data.token,
        };
      }
    },
  },
});

const graphqlSchema = schemaComposer.buildSchema();
export default graphqlSchema;
