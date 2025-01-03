import { SchemaComposer } from 'graphql-compose';
import { composeWithMongoose } from 'graphql-compose-mongoose';
import users from '../datamodels/users.mjs';
import UserModel from '../datamodels/user.mjs';
import database from '../db/database.mjs';
import bcrypt from 'bcryptjs';

await database.connectMongoose();

// Initialize SchemaComposer
const schemaComposer = new SchemaComposer();
const UserTypeComposer = composeWithMongoose(UserModel, { name: 'User' });

// Helper function to check if the user is an admin
const isAdmin = (context) => {
  if (!context.user || !context.user.admin) {
    throw new Error('Access denied: Admin only');
  }
  return true;
};


schemaComposer.Query.addFields({
  // Fetch all users (only for admin users)
  usersData: {
    type: [UserTypeComposer.getType()],
    resolve: async (_, args, context) => {
      isAdmin(context);
      return UserModel.find();
    },
  },

  // Fetch user by ID
  userById: {
    type: UserTypeComposer.getType(),
    args: { _id: 'ID!' },
    resolve: async (_, { _id }, context) => {
      isAdmin(context);
      const userData = await UserModel.findById(_id);
      if (!userData) {
        throw new Error('User not found');
      }
      return userData;
    },
  },

  // Fetch user data by email (only for the user themselves or an admin)
  userDataByEmail: {
    type: UserTypeComposer.getType(),
    args: { email: 'String' },
    resolve: async (_, { email }, context) => {
      if (context.user.admin || context.user.user === email) {
        console.log('hereeeee  ', context.user.admin, context.user, email )
        const userData = await users.getdataByEmail(email);
        if (!userData) {
          throw new Error('User not found');
        }
        return userData;
      } else {
        throw new Error('Access denied: You can only access your own data or perform admin actions');
      }
    },
  },
});

// Add mutations for modifying data
schemaComposer.Mutation.addFields({
  updateBalance: {
    type: UserTypeComposer.getType(),
    args: {
      email: 'String',
      amount: 'Float',
    },
    resolve: async (_, { email, amount }, context) => {
      if (context.user.admin || context.user.user === email) {
        const userData = await users.getdataByEmail(email);
        if (!userData) {
          throw new Error('User not found');
        }

        const updatedUserData = await users.updateBalance(email, amount);
        return updatedUserData;
      } else {
        throw new Error('Access denied: You can only update your own balance or perform admin actions');
      }
    },
  },

  // Update user by ID
  updateUserById: {
    type: UserTypeComposer.getType(),
    args: {
      _id: 'ID!',
      email: 'String',
      password: 'String',
      name: 'String',
      surname: 'String',
      amount: 'Float',
    },
    resolve: async (_, { _id, email, password, name, surname, amount }, context) => {
      if (context.user.admin || context.user._id === _id) {
        const updateData = {};

        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (surname) updateData.surname = surname;
        if (amount) updateData.amount = amount;
        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          updateData.password = hashedPassword;
        }
        const updatedUser = await UserModel.findByIdAndUpdate(_id, { $set: updateData }, { new: true });

        if (!updatedUser) {
          throw new Error('User not found');
        }

        return updatedUser;
      } else {
        throw new Error('Access denied: You can only update your own data or perform admin actions');
      }
    },
  },

  // Remove user by ID (only for admin users)
  userRemoveById: {
    type: UserTypeComposer.getType(),
    args: { _id: 'ID!' },
    resolve: async (_, { _id }, context) => {
      isAdmin(context);
      const userToRemove = await UserModel.findByIdAndDelete(_id);
      if (!userToRemove) {
        throw new Error('User not found');
      }
      return userToRemove;
    },
  },
  // Remove user by email (only for admin users)
  userRemoveByEmail: {
    type: UserTypeComposer.getType(),
    args: { email: 'String' },
    resolve: async (_, { email }, context) => {
      isAdmin(context);
      const userToRemove = await UserModel.findOneAndDelete({ email });

      if (!userToRemove) {
        throw new Error('User not found');
      }
      return userToRemove;
    },
  },  
});

const graphqlSchemaU = schemaComposer.buildSchema();
export default graphqlSchemaU;
