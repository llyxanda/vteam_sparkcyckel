import { SchemaComposer } from 'graphql-compose';
import { composeWithMongoose } from 'graphql-compose-mongoose';
import trips from '../datamodels/trips.mjs';
import TripModel from '../datamodels/trip.mjs';
import database from '../db/database.mjs';
import isAdmin from '../utils.mjs';

await database.connectMongoose();

const schemaComposer = new SchemaComposer();
const TripTypeComposer = composeWithMongoose(TripModel, { name: 'Trip' });

schemaComposer.Query.addFields({
    // Fetch all trips. Admins only.
    tripsData: {
        type: [TripTypeComposer.getType()],
        resolve: async (_, args, context) => {
            isAdmin(context);
            return TripModel.find();
        }
    },

    tripsByEmail: {
        // Fetch all trips for a user.
        type: [TripTypeComposer.getType()],
        args: {email: 'String'},
        resolve: async (_, { email }, context) => {
            if (context.user.admin || context.user.user === email) {
                const tripData = await trips.getdataByEmail(email);
                console.log(tripData);
                if (!tripData) {
                    throw new Error('Trip not found.');
                }
                return tripData;
            } else {
                throw new Error('Access denied: You can only access your own data or perform admin actions.')
            }
        }
    },
});

const graphqlSchema = schemaComposer.buildSchema();
export default graphqlSchema;