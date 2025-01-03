import { composeWithMongoose } from 'graphql-compose-mongoose';
import { SchemaComposer } from 'graphql-compose';
import Scooter from '../datamodels/scooter.mjs';
import database from '../db/database.mjs';
import isAdmin from '../utils.mjs';
//await database.connectMongoose();

const schemaComposer = new SchemaComposer();

// Create TypeComposer for the Scooter model
const ScooterTypeComposer = composeWithMongoose(Scooter);

const ScooterUpdateInput = schemaComposer.createInputTC({
    name: 'ScooterUpdateInput',
    fields: {
      customid: 'String',
      status: 'String',
      speed: 'Float',
      battery_level: 'Float',
      at_station: 'String',
      designated_parking: 'Boolean',
    },
  });
  

// Add queries
schemaComposer.Query.addFields({
    scooter: ScooterTypeComposer.getResolver('findById'),
    scooters: ScooterTypeComposer.getResolver('findMany'),
    scooterById: {
        type: ScooterTypeComposer,
        args: {
          customid: 'String!'
        },
        resolve: async (_, { customid }) => {
          return await Scooter.findOne({ customid });
        },
      },
    // Query to find scooters within a specific radius from a given location
    scootersNearby: {
        type: [ScooterTypeComposer],
        args: {
            longitude: 'Float!',
            latitude: 'Float!',
            meters: 'Float!',
        },
        resolve: async (_, { longitude, latitude, meters }) => {
            return await Scooter.find({
                current_location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude],
                        },
                        $maxDistance: meters,
                    },
                },
            });
        },
    },

    // Query to get all active scooters
    activeScooters: {
        type: [ScooterTypeComposer],
        resolve: async () => {
            return await Scooter.find({ status: 'active' });
        },
    },

    // Query to find scooters at a specific station
    scooterAtStation: {
        type: [ScooterTypeComposer],
        args: {
            station: 'String!',
        },
        resolve: async (_, { station }) => {
            return await Scooter.find({ at_station: station });
        },
    },

    // Query to find scooters with designated parking
    scootersWithDesignatedParking: {
        type: [ScooterTypeComposer],
        resolve: async () => {
            return await Scooter.find({ designated_parking: true });
        },
    },
});

schemaComposer.Mutation.addFields({
    scooterCreateOne: {
        type: ScooterTypeComposer,
        args: {
            record: ScooterTypeComposer.getInputType(),
        },
        resolve: async (_, { record }, context) => {
            isAdmin(context);
            const scooter = await Scooter.create(record);
            return scooter;
        },
    },
    scooterUpdateById: {
        type: ScooterTypeComposer,
        args: {
            customid: 'String!',
            record: ScooterUpdateInput,
        },
        resolve: async (_, { customid, record }, context) => {
            isAdmin(context);
            const scooter = await Scooter.findOneAndUpdate(
                { customid },
                { $set: record },
                { new: true }
            );
            return scooter;
        },
    },
    scooterDeleteById: {
        type: 'Boolean',
        args: {
            customid: 'String!',
        },
        resolve: async (_, { customid }, context) => {
            isAdmin(context);
            const result = await Scooter.deleteOne({ customid });
            return result.deletedCount === 1;
        },
    },
    scooterDeleteAll: {
        type: 'Boolean',
        resolve: async (_, __, context) => {
            isAdmin(context);
            await Scooter.deleteMany();
            return true;
        },
    },
});

const graphqlSchema = schemaComposer.buildSchema();
export default graphqlSchema;
