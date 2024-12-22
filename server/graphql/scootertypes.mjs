import { composeWithMongoose } from 'graphql-compose-mongoose';
import { SchemaComposer } from 'graphql-compose';
import Scooter from '../datamodels/scooter.mjs';
import database from '../db/database.mjs';

await database.connectMongoose();

const schemaComposer = new SchemaComposer();

const ScooterTypeComposer = composeWithMongoose(Scooter);

schemaComposer.Query.addFields({
    scooter: ScooterTypeComposer.getResolver('findById'),
    scooters: ScooterTypeComposer.getResolver('findMany'),
});

schemaComposer.Mutation.addFields({
    scooterCreateOne: ScooterTypeComposer.getResolver('createOne'),
    scooterUpdateById: ScooterTypeComposer.getResolver('updateById'),
    scooterRemoveById: ScooterTypeComposer.getResolver('removeById'),
});

const graphqlSchema = schemaComposer.buildSchema();
export default graphqlSchema;
