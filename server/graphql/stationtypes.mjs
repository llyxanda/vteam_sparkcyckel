import { composeWithMongoose } from 'graphql-compose-mongoose';
import { SchemaComposer } from 'graphql-compose';
import Station from '../datamodels/station.mjs';
import database from '../db/database.mjs';

await database.connectMongoose();

const schemaComposer = new SchemaComposer();

const StationTypeComposer = composeWithMongoose(Station);

schemaComposer.Query.addFields({
    station: StationTypeComposer.getResolver('findById'),
    stations: StationTypeComposer.getResolver('findMany'),
});

schemaComposer.Mutation.addFields({
    stationCreateOne: StationTypeComposer.getResolver('createOne'),
    stationUpdateById: StationTypeComposer.getResolver('updateById'),
    stationRemoveById: StationTypeComposer.getResolver('removeById'),
});

const graphqlSchema = schemaComposer.buildSchema();
export default graphqlSchema;
