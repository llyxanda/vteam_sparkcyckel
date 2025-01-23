import { composeWithMongoose } from 'graphql-compose-mongoose';
import { SchemaComposer } from 'graphql-compose';
import Scooter from '../datamodels/scooter.mjs';
import Stations from '../datamodels/stations.mjs';
import isAdmin from '../utils.mjs';


const schemaComposer = new SchemaComposer();

// Create TypeComposer for the Scooter model
const ScooterTypeComposer = composeWithMongoose(Scooter);
const StationTypeComposer = composeWithMongoose(Stations);

const ScooterUpdateInput = schemaComposer.createInputTC({
    name: 'ScooterUpdateInput',
    fields: {
        customid: 'String',
        status: 'String',
        battery_level: 'Float',
        at_station: 'String',
        designated_parking: 'Boolean',
        current_location: {
            type: 'JSON', // GeoJSON object for the location
            description: 'The current location of the scooter as a GeoJSON object with type and coordinates',
        },
    },
});

  

// Add queries
schemaComposer.Query.addFields({
    scooter: ScooterTypeComposer.getResolver('findById'),
    scooters: ScooterTypeComposer.getResolver('findMany'),
    stations: StationTypeComposer.getResolver('findMany'),
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

    // Query to get all active scooters
    inactiveScooters: {
        type: [ScooterTypeComposer],
        resolve: async () => {
            return await Scooter.find({ status: 'inactive' });
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
    scootersAtDesignatedParking: {
        type: [ScooterTypeComposer],
        resolve: async () => {
            return await Scooter.find({ designated_parking: true });
        },
    },
});


// Add queries
schemaComposer.Query.addFields({
    countScootersInCity: {
        type: 'Int',
        args: {
            city: 'String!',
        },
        resolve: async (_, { city }) => {
            const stationsInCity = await Stations.find({ city: new RegExp(city, 'i') }, { name: 1 });
            const stationNames = stationsInCity.map(station => station.name);
            return await Scooter.countDocuments({ at_station: { $in: stationNames } });
        },
    },
    scooterAtStation: {
        type: [ScooterTypeComposer],
        args: {
            station: 'String!',
        },
        resolve: async (_, { station }) => {
            return await Scooter.find({ at_station: station });
        },
    },
    stationsWithChargingInCity: {
        type: [StationTypeComposer],
        args: {
            city: 'String!',
        },
        resolve: async (_, { city }) => {
            return await Stations.find({ city: new RegExp(city, 'i'), charging_station: true });
        },
    },
    // Query to find scooters within a specific radius from a given location
    parkingStationsinCity: {
        type: [StationTypeComposer],
        args: {
            city: 'String!',
        },
        resolve: async (_, { city }) => {
            return await Stations.find({ city: new RegExp(city, 'i'), charging_station: false });
        },
    },

    uniqueCities: {
        type: '[String]',
        resolve: async () => {
          const cities = await Stations.distinct('city');
          return cities;
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
            isAdmin(context); // Authorization check
            try {
                const scooter = await Scooter.findOneAndUpdate(
                    { customid },
                    { $set: record },
                    { new: true } // Return the updated document
                );
                if (scooter) {
                    console.log(`Scooter ${customid} updated:`, scooter);
                    return scooter;
                } else {
                    console.log(`Scooter ${customid} not found`);
                }
            } catch (error) {
                console.error(`Error updating scooter ${customid}:`, error);
                throw new Error(`Failed to update scooter: ${error.message}`);
            }
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
