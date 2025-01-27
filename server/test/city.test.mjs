import request from 'supertest';
import { expect } from 'chai';
import server from '../app.mjs';
import ScooterModel from '../datamodels/scooter.mjs';
import UserModel from '../datamodels/user.mjs';
import StationsModel from '../datamodels/stations.mjs';

process.env.NODE_ENV = 'test';

describe('GraphQL API Tests', () => {
  let authToken;

  before(async () => {
    // Clean and seed database
    await UserModel.deleteMany({});
    await ScooterModel.deleteMany({});
    await StationsModel.deleteMany({});

    // Register admin user
    const mutationRegister = `
      mutation {
        register(email: "adminuser@example.com", password: "password123", admin: true) {
          message
          user {
            _id
            email
            name
            amount
          }
        }
      }
    `;
    const resRegister = await request(server)
      .post('/graphql/auth')
      .send({ query: mutationRegister });
    expect(resRegister.status).to.equal(200);

      // Log in as the admin user to get the token
      const mutationLogin = `
        mutation {
          login(email: "adminuser@example.com", password: "password123", admin: true) {
            message
            user {
              _id
              email
              admin
            }
            token
          }
        }
      `;
      const responseLogin = await request(server)
        .post('/graphql/auth')
        .send({ query: mutationLogin })
        .set('Accept', 'application/json');
      
      const registeredUser = responseLogin.body.data.login.user;
      expect(responseLogin.status).to.equal(200);
      //console.log(resRegister);
      expect(responseLogin.body.data.login.token).to.be.a('string');
  
      authToken = responseLogin.body.data.login.token;  

    // Seed initial data
    await StationsModel.insertMany([
      {
        name: 'Station A',
        city: 'City X',
        charging_station: true,
        no_of_scooters_max: 10,
        location: {
          type: "Point",
          coordinates: [12.4924, 41.8902],
        },
      },
      {
        name: 'Station B',
        city: 'City X',
        charging_station: false,
        no_of_scooters_max: 5,
        location: {
          type: "Point",
          coordinates: [13.4105, 52.5200],
        },
  
      },
    ]);
    
    await ScooterModel.insertMany([
      { customid: 'scooter1', status: 'active',       battery_level: 77, at_station: 'Station A', designated_parking: true },
      { customid: 'scooter2', status: 'inactive',       battery_level: 77,at_station: 'Station B', designated_parking: false },
    ]);
  });

  after(async () => {
    await UserModel.deleteMany({});
    await ScooterModel.deleteMany({});
    await StationsModel.deleteMany({});
  });

  it('should fetch the count of scooters in a city', async () => {
    const query = `
      query {
        countScootersInCity(city: "City X")
      }
    `;
    const res = await request(server)
      .post('/graphql/scooters')
      .send({ query })
      .set('Authorization', `Bearer ${authToken}`);
      //console.log('count: ',res.body)
    expect(res.body.data.countScootersInCity).to.equal(2);
  });

  it('should fetch scooters at a specific station', async () => {
    const query = `
      query {
        scooterAtStation(station: "Station A") {
          customid
          status
        }
      }
    `;
    const res = await request(server)
      .post('/graphql/scooters')
      .send({ query })
      .set('Authorization', `Bearer ${authToken}`);
    console.log('scooter at station:  ',res.body.data.scooterAtStation)
    expect(res.body.data.scooterAtStation).to.deep.include({ customid: 'scooter1', status: 'active' });
  });

  it('should fetch stations with charging in a city', async () => {
    const query = `
      query {
        stationsWithChargingInCity(city: "City X") {
          name
          charging_station
        }
      }
    `;
    const res = await request(server)
      .post('/graphql/scooters')
      .send({ query })
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.body.data.stationsWithChargingInCity).to.have.length(1);
    expect(res.body.data.stationsWithChargingInCity[0]).to.include({ name: 'Station A', charging_station: true });
  });

  it('should fetch parking stations in a city', async () => {
    const query = `
      query {
        parkingStationsinCity(city: "City X") {
          name
        }
      }
    `;
    const res = await request(server)
      .post('/graphql/scooters')
      .send({ query })
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.body.data.parkingStationsinCity).to.have.length(1);
    expect(res.body.data.parkingStationsinCity[0].name).to.equal('Station B');
  });

  
  it('should fetch all the cities', async () => {
    const query = `
      query {
        uniqueCities
      }
    `;
    const res = await request(server)
      .post('/graphql/scooters')
      .send({ query })
      .set('Authorization', `Bearer ${authToken}`);
    console.log(res.body)
    expect(res.body.data.uniqueCities).to.have.length(1);
  });

});
