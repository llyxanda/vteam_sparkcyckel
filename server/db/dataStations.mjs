import dotenv from 'dotenv';
import path from 'path';

import database from './database.mjs'; 
import Stations from '../datamodels/stations.mjs';

// Load .env from a specific folder
dotenv.config({ path: path.resolve('../.env') });

const stations = [
  // Stockholm
  { name: 'Stockholm Central', city: 'Stockholm', charging_station: true, no_of_scooters_max: 15, location: { type: 'Point', coordinates: [18.059196, 59.329323] } },
  { name: 'Södermalm Station', city: 'Stockholm', charging_station: false, no_of_scooters_max: 10, location: { type: 'Point', coordinates: [18.0649, 59.3170] } },
  { name: 'Kungsholmen Hub', city: 'Stockholm', charging_station: true, no_of_scooters_max: 20, location: { type: 'Point', coordinates: [18.0359, 59.3326] } },
  
  // Göteborg
  { name: 'Göteborg Central', city: 'Göteborg', charging_station: true, no_of_scooters_max: 518, location: { type: 'Point', coordinates: [11.9733, 57.7089] } },
  { name: 'Linnéplatsen Station', city: 'Göteborg', charging_station: false, no_of_scooters_max: 412, location: { type: 'Point', coordinates: [11.9497, 57.6933] } },
  { name: 'Hisingen Hub', city: 'Göteborg', charging_station: true, no_of_scooters_max: 522, location: { type: 'Point', coordinates: [11.9379, 57.7274] } },
  
  // Malmö
  { name: 'Malmö Central', city: 'Malmö', charging_station: true, no_of_scooters_max: 160, location: { type: 'Point', coordinates: [13.0038, 55.6090] } },
  { name: 'Västra Hamnen Station', city: 'Malmö', charging_station: false, no_of_scooters_max: 511, location: { type: 'Point', coordinates: [12.9852, 55.6156] } },
  { name: 'Triangeln Hub', city: 'Malmö', charging_station: true, no_of_scooters_max: 419, location: { type: 'Point', coordinates: [13.0031, 55.5954] } },
];
async function insertStations() {
  try {

    await database.connectMongoose();

    await Stations.deleteMany({});
    const result = await Stations.insertMany(stations);
    console.log(`${result.length} stations inserted successfully!`);
  } catch (error) {
    console.error("Error inserting stations:", error);
  } finally {
    process.exit(); // Exit the script after execution
  }
}

insertStations();