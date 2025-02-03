import database from './database.mjs';
import Scooter from '../datamodels/scooter.mjs';
import mongoose from 'mongoose';

import dotenv from 'dotenv';
import path from 'path';

// Load .env from a specific folder
dotenv.config({ path: path.resolve('../.env') });


const dbUtils = {
    /**
     * Creates <scootersToCreate> custom scooter IDs of <idLength> length.
     * @param {Number} scootersToCreate The number of scooters that should be created.
     * @param {Number} idLength The format of the ID, e.g. 3 = 001. Must be >= scootersToCreate.length.
     * @returns {Array} An array of IDs.
     */
    createScooterIdList: (scootersToCreate, idLength) => {
        try {
            let i = 1; // Default should be 1.
            let id = "";
            let customIdList = [];
            while (i <= scootersToCreate) {
                let totalNumberOfDigits = idLength - i.toString().length;
                id = "0".repeat(totalNumberOfDigits) + i;
                customIdList.push(id);
                i++
            }
            // console.log(customIdList);
            // console.log(customIdList.length);
            return customIdList;
        } catch(RangeError) {
            console.error(RangeError);
            console.error('@param idLength must be >= the number of digits in @param scootersToCreate.');
            console.error(`${idLength} must be >= ${scootersToCreate.toString().length}.`);
            return [];
        }
    },

    /**
     * 
     * @param {Array} customIdList 
     * @returns {Array} An array of scooter document objects.
     */
    createScooterObjects: (customIdList) => {
        let documents = [];
        let document = {};
        const stations = [
            {
                name: "Stockholm Central",
                coordinates: [
                    18.059196,
                    59.329323
                ],
            },
            {
                name: "Göteborg Central",
                coordinates: [
                    11.9733,
                    57.7089
                ],
            },
            {
                name: "Malmö Central",
                coordinates: [
                    13.0038, // Longitude.
                    55.609 // Latitude.
                ],
            },
        ];

        try {
            if (customIdList.length > 0) {
                let cityThreshold = Math.floor((customIdList.length / 3));
                let cityIndex = 0;
                for (const [i, customId] of customIdList.entries()) {
                    if (i > cityThreshold && cityIndex < 2) {
                        cityIndex++;
                        cityThreshold += Math.floor((customIdList.length / 3));
                    }
                    let lon = stations[cityIndex].coordinates[0] + ((Math.random() * 2 - 1) * 0.0001);
                    let lat = stations[cityIndex].coordinates[1] + ((Math.random() * 2 - 1) * 0.0001);
                    document = {
                        customid: customId,
                        status: 'inactive',
                        battery_level: 100,
                        current_location: {
                            type: "Point",
                            coordinates: [
                                lon,
                                lat
                            ],
                        },
                        at_station: stations[cityIndex].name,
                        designated_parking: true,
                    }
                    documents.push(document);
                }
                return documents;
            }
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    /**
     * Inserts <scootersToCreate> scooters with custom IDs of <idLength> length.
     * @param {Number} scootersToCreate The number of scooters that should be created.
     * @param {Number} idLength The format of the ID, e.g. 3 = 001. Must be >= scootersToCreate.length.
     * @returns {Array} An array of IDs.
     */
    insertScooterDocuments: async (scootersToCreate, idLength) => {
        const customIdList = dbUtils.createScooterIdList(scootersToCreate, idLength);
        const documents = dbUtils.createScooterObjects(customIdList);
        if (documents.length > 0) {
            try {
                await database.connectMongoose();
                await Scooter.deleteMany({}); // Remove existing scooters.
                await Scooter.insertMany(documents);
                console.log(documents);
                console.log(`${documents.length} scooters were added to the database.`);
            } catch (error) {
                console.error(error);
            } finally {
                await mongoose.disconnect();
            }
        }
    }
};

// Call the function directly at the bottom.
dbUtils.insertScooterDocuments(3000, 7)
    .then(() => {
        console.log('Scooter documents have been successfully added.');
    })
    .catch((error) => {
        console.error('An error occurred:', error);
    });