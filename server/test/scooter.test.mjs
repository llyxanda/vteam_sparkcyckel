import request from 'supertest';
import { expect } from 'chai';
import server from '../app.mjs';
import ScooterModel from '../datamodels/scooter.mjs';
import UserModel from '../datamodels/user.mjs';

process.env.NODE_ENV = 'test';

describe('Scooter GraphQL API', () => {
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
        register(email: "adminuser@example.com", password: "password123", admin: true) {
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

    // Register a non-admin user
    const mutationRegister2 = `
      mutation {
        register(email: "testuser@example.com", password: "password123") {
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
    const responseRegister2 = await request(server)
      .post('/graphql/auth')
      .send({ query: mutationRegister2 })
      .set('Accept', 'application/json');

    expect(responseRegister2.status).to.equal(200);

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
    
    registeredUser = responseLogin.body.data.login.user;
    expect(responseLogin.status).to.equal(200);
    expect(responseLogin.body.data.login.token).to.be.a('string');

    authToken = responseLogin.body.data.login.token;

    // Create two scooters in the database using createOne
    const scooterData1 = {
      customid:"id00001",
      status: "active",
      speed: 20,
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
      speed: 15,
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
          speed
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

  // Test creating a scooter (admin only)
  it('should create a scooter (admin only)', async () => {
    const mutation = `
      mutation {
        scooterCreateOne(record: {
          customid:"id00003",
          status: "active",
          speed: 25,
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
          speed
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
    
    ////console.log (response.body) 
    expect(response.status).to.equal(200);
    expect(response.body.data.scooterCreateOne).to.be.an('object');
    expect(response.body.data.scooterCreateOne.status).to.equal('active');
    expect(response.body.data.scooterCreateOne.customid).to.equal('id00003');
  });

  // Test updating a scooter by custom id (admin only)
  it('should update a scooter by custom id (admin only)', async () => {
    const mutation = `
      mutation {
        scooterUpdateById(customid: "id00001", record: {
          speed: 30,
          battery_level: 85
        }) {
          _id
          customid
          speed
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
    expect(response.body.data.scooterUpdateById).to.be.an('object');
    expect(response.body.data.scooterUpdateById.speed).to.equal(30);
    expect(response.body.data.scooterUpdateById.battery_level).to.equal(85);
  });

  // Test deleting a scooter by custom id (admin only)
  it('should delete a scooter by custom id (admin only)', async () => {
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
    expect(response.body.data.scooterDeleteById).to.equal(true);
  });
  it('should update a scooter location by custom id (admin only)', async () => {
    const mutation = `
      mutation {
        scooterUpdateById(customid: "id00001", record: {
          current_location: {
            type: "Point",
            coordinates: [-3.856080, 0.848450]
          }
        }) {
          _id
          customid
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
    
    expect(response.status).to.equal(200);
    expect(response.body.data.scooterUpdateById).to.be.an('object');
    expect(response.body.data.scooterUpdateById.current_location).to.deep.equal({
      type: 'Point',
      coordinates: [-3.856080, 0.848450],
    });
  
    // Fetch the scooter to verify location update
    const query = `
      query {
        scooters {
          _id
          customid
          current_location {
            type
            coordinates
          }
        }
      }
    `;
    
    const fetchResponse = await request(server)
      .post('/graphql/scooters')
      .send({ query })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(fetchResponse.status).to.equal(200);
    const updatedScooter = fetchResponse.body.data.scooters.find(scooter => scooter.customid === 'id00001');
    expect(updatedScooter).to.not.be.undefined;
    expect(updatedScooter.current_location.coordinates).to.deep.equal([-3.856080, 0.848450]);
  });
  

});
