import request from 'supertest';
import { expect } from 'chai';
import server from '../app.mjs';
import ScooterModel from '../datamodels/scooter.mjs';
import UserModel from '../datamodels/user.mjs';

process.env.NODE_ENV = 'test';

describe('Scooter non admin GraphQL API', () => {
  let authToken;
  let registeredUser;

  // Register a user and login
  before(async () => {
    // Clear database before tests and insert initial data
    await UserModel.deleteMany({});
    await ScooterModel.deleteMany({});

    // Register an admin user
    const mutationRegister = `
      mutation {
        register(email: "adminuser@example.com", password: "password123") {
          message
          user {
            _id
            email
            admin
          }
        }
      }
    `;
    const responseRegister = await request(server)
      .post('/graphql/auth')
      .send({ query: mutationRegister })
      .set('Accept', 'application/json');

    expect(responseRegister.status).to.equal(200);

    // Log in as the non admin user to get the token
    const mutationLogin = `
      mutation {
        login(email: "adminuser@example.com", password: "password123") {
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
    
    registeredUser = responseLogin.body.data.login.user;
    expect(responseLogin.status).to.equal(200);
    expect(responseLogin.body.data.login.token).to.be.a('string');

    authToken = responseLogin.body.data.login.token;

    // Create two scooters in the database using createOne
    const scooterData1 = {
      customid:"id00001",
      status: "active",
      battery_level: 75,
      current_location: {
        type: "Point",
        coordinates: [-73.856077, 40.848447]
      },
      at_station: "Station A",
      designated_parking: true
    };

    const scooterData2 = {
      customid:"id00002",
      status: "inactive",
      battery_level: 50,
      current_location: {
        type: "Point",
        coordinates: [-73.856078, 40.848448]
      },
      at_station: "Station B",
      designated_parking: false
    };

    await ScooterModel.create(scooterData1);
    await ScooterModel.create(scooterData2);
  });

  // Clean up after tests
  after(async () => {
    await UserModel.deleteMany({});  // Clear all test data
    await ScooterModel.deleteMany({});
  });

  // Test fetching scooters
  it('should fetch scooters', async () => {
    const query = `
      query {
        scooters {
          _id
          status
          battery_level
          current_location {
            type
            coordinates
          }
        }
      }
    `;
    const response = await request(server)
      .post('/graphql/scooters')
      .send({ query })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).to.equal(200);
    expect(response.body.data.scooters).to.be.an('array');
    expect(response.body.data.scooters.length).to.equal(2);
  });

  // Test creating a scooter (non admin)
  it('should create a scooter (non admin)', async () => {
    const mutation = `
      mutation {
        scooterCreateOne(record: {
          customid:"id00003",
          status: "active",
          battery_level: 90,
          current_location: {
            type: Point,
            coordinates: [-73.856079, 40.848448]
          },
          at_station: "Station C",
          designated_parking: true
        }) {
          _id
          customid
          status
          battery_level
          current_location {
            type
            coordinates
          }
        }
      }
    `;
    const response = await request(server)
      .post('/graphql/scooters')
      .send({ query: mutation })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    //console.log (response.body) 
    expect(response.status).to.equal(200);
    expect(response.body.errors[0].message).to.contain("Access denied");
  });

  // Test updating a scooter by custom id (non admin)
  it('should update a scooter by custom id (non admin)', async () => {
    const mutation = `
      mutation {
        scooterUpdateById(customid: "id00001", record: {
          battery_level: 85
        }) {
          _id
          customid
          battery_level
        }
      }
    `;
    const response = await request(server)
      .post('/graphql/scooters')
      .send({ query: mutation })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    //console.log (response.body);
    expect(response.status).to.equal(200);
    expect(response.body.errors[0].message).to.contain("Access denied");
  });

  // Test deleting a scooter by custom id (non admin)
  it('should delete a scooter by custom id (non admin)', async () => {
    const mutation = `
      mutation {
        scooterDeleteById(customid: "id00002")
      }
    `;
    const response = await request(server)
      .post('/graphql/scooters')
      .send({ query: mutation })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).to.equal(200);
    expect(response.body.errors[0].message).to.contain("Access denied");
    expect(response.body.data.scooterDeleteById).to.equal(null);
  });

});
