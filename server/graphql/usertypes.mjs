import { SchemaComposer } from 'graphql-compose';
import { composeWithMongoose } from 'graphql-compose-mongoose';
import users from '../datamodels/users.mjs';
import user from '../datamodels/user.mjs';
import database from '../db/database.mjs';

await database.connectMongoose();

// Initialize SchemaComposer
const schemaComposer = new SchemaComposer();
const UserModel = user;
const UserTypeComposer = composeWithMongoose(UserModel, { name: 'User' });


// Add queries for fetching data
schemaComposer.Query.addFields({
  usersData: UserTypeComposer.getResolver('findMany'),
  userById: UserTypeComposer.getResolver('findById'),
  userDataByEmail: {
    type: UserTypeComposer.getType(),
    args: { email: 'String' },
    resolve: async (_, { email }) => {
      const userData = await users.getdataByEmail(email);
      if (!userData) {
        throw new Error('User not found');
      }
      return userData;
    },
  },
});

schemaComposer.Mutation.addFields({
  updateBalance: {
    type: UserTypeComposer.getType(),
    args: {
      email: 'String',
      amount: 'Float',
    },
    resolve: async (_, { email, amount }) => {
      const userData = await users.getdataByEmail(email);
      if (!userData) {
        throw new Error('User not found');
      }

      const updatedUserData = await users.updateBalance(email, amount);
      return updatedUserData;
    },
  },
  updateUserById: UserTypeComposer.getResolver('updateById'),
  userRemoveById: UserTypeComposer.getResolver('removeById'),
});

const graphqlSchemaU = schemaComposer.buildSchema();
export default graphqlSchemaU;
