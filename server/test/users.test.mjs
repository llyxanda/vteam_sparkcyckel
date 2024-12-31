import request from 'supertest';
import { expect } from 'chai';
import server from '../app.mjs';
import UserModel from '../datamodels/user.mjs';


process.env.NODE_ENV = 'test';

describe('User and Auth GraphQL API', () => {

  let authToken;
  let registeredUser;

  // Register a user and login to get the token before running tests
  before(async () => {
    // Clear database before tests and insert initial users
    await UserModel.deleteMany({});

    // Register a new user
    const mutationRegister = `
      mutation {
        register(email: "testuser@example.com", password: "password123", name: "Test", surname: "User", admin: true) {
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
    const responseRegister = await request(server)
      .post('/graphql/auth')
      .send({ query: mutationRegister })
      .set('Accept', 'application/json');
    
    expect(responseRegister.status).to.equal(200);

    const mutationRegister2 = `
    mutation {
      register(email: "testuser2@example.com", password: "password123", name: "Test", surname: "User") {
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
    // Log in the registered user to get the token
    const mutationLogin = `
      mutation {
        login(email: "testuser@example.com", password: "password123", admin: true) {
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
    console.log('login ', responseLogin.body.data);
    expect(responseLogin.body.data.login.token).to.be.a('string');

    authToken = responseLogin.body.data.login.token;  // Store the token for use in further tests
  });

  // Clean up after tests
  after(async () => {
    await UserModel.deleteMany({});  // Clear all test data after tests are done
  });


  //Test fetching user data by email
  it('should fetch user data by email', async () => {
    const query = `
      query {
        userDataByEmail(email: "testuser@example.com") {
        _id
          email
          name
          amount
        }
      }
    `;
    const response = await request(server)
      .post('/graphql/users')
      .send({ query })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);  // Add the token in the Authorization header
    
    expect(response.status).to.equal(200);
    console.log(response.body.data.userDataByEmail)
    expect(response.body.data.userDataByEmail).to.be.an('object');
    expect(response.body.data.userDataByEmail.email).to.equal('testuser@example.com');
    expect(response.body.data.userDataByEmail.name).to.equal('Test');
    expect(response.body.data.userDataByEmail.amount).to.equal(0);
  });

  //Test updating user balance
  it('should update the balance of the registered user (authenticated)', async () => {
    const mutation = `
      mutation {
        updateBalance(email: "testuser@example.com", amount: 500.50) {
          email
          amount
        }
      }
    `;
    const response = await request(server)
      .post('/graphql/users')
      .send({ query: mutation })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).to.equal(200);
    expect(response.body.data.updateBalance).to.be.an('object');
    expect(response.body.data.updateBalance.amount).to.equal(500.50);
  });

  // Test fetching all users data (authenticated request)
  it('should fetch all users data', async () => {
    const query = `
      query {
        usersData {
          email
          name
          amount
        }
      }
    `;
    const response = await request(server)
      .post('/graphql/users')
      .send({ query })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    console.log('Users', response.body.data.usersData)
    expect(response.status).to.equal(200);
    expect(response.body.data.usersData).to.be.an('array');
    expect(response.body.data.usersData.length).to.equal(2);
    const user = response.body.data.usersData.find(u => u.email === 'testuser@example.com');
    expect(user).to.exist;
    expect(user.email).to.equal('testuser@example.com');
    expect(user.name).to.equal('Test');
  });


  it('should update user by ID', async () => {
    const mutation = `
      mutation {
        updateUserById(_id: "${registeredUser._id}", name: "Updated Admin User", surname: "Updated") {
          _id
          name
          surname
        }
      }
    `;

    const response = await request(server)
      .post('/graphql/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: mutation });
    console.log('update resp ', response.body)
    expect(response.status).to.equal(200);
    expect(response.body.data.updateUserById.name).to.equal('Updated Admin User');
    expect(response.body.data.updateUserById.surname).to.equal('Updated');
  });

});
