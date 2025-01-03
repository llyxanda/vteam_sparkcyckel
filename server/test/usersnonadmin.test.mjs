import request from 'supertest';
import { expect } from 'chai';
import server from '../app.mjs';
import UserModel from '../datamodels/user.mjs';


process.env.NODE_ENV = 'test';

describe('User Non Admin GraphQL API', () => {

  let authToken;
  let registeredUser;

  // Register a user and login to get the token before running tests
  before(async () => {
    // Clear database before tests and insert initial users
    await UserModel.deleteMany({});

    // Register a new user
    const mutationRegister = `
      mutation {
        register(email: "testuser@example.com", password: "password123", name: "Test", surname: "User") {
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
        login(email: "testuser@example.com", password: "password123") {
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

    expect(responseLogin.status).to.equal(200);
    expect(responseLogin.body.data.login.token).to.be.a('string');
    registeredUser = responseLogin.body.data.login.user;
    authToken = responseLogin.body.data.login.token;
  });

  // Clean up after tests
  after(async () => {
    await UserModel.deleteMany({});
  });


  //Test fetching user data by email
  it('should not fetch user data by email except for the log in user', async () => {
    const query = `
      query {
        userDataByEmail(email: "testuser2@example.com") {
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
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).to.equal(200);
    expect(response.body.errors[0]).to.be.an('object');
    expect(response.body.errors[0].message).to.include('Access denied: You can only access your own data');
  });

  
  //Test fetching user data by email
  it('should fetch user data by email for loged in user even if not admin', async () => {
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
    
    console.log('user data', response.status, response.body)
    expect(response.status).to.equal(200);
    expect(response.body.data.userDataByEmail.email).to.equal('testuser@example.com');
    });

  //Test updating user balance
  it('should not be able to update the balance of another user if not admin', async () => {
    const mutation = `
      mutation {
        updateBalance(email: "testuser2@example.com", amount: 500.50) {
          email
          amount
        }
      }
    `;
    const response = await request(server)
      .post('/graphql/users')
      .send({ query: mutation })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);  // Add the token in the Authorization header
    
    expect(response.status).to.equal(200);
    expect(response.body.errors[0]).to.be.an('object');
    expect(response.body.errors[0].message).to.include('Access denied');

  });

  //Test updating user balance
  it('should update the balance of the loged in user even if not admin', async () => {
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
    console.log('Users', response.body)
    expect(response.status).to.equal(200);
    expect(response.body.errors[0].message).to.include('Access denied');
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
    console.log('update resp ', response.body, registeredUser)
    expect(response.status).to.equal(200);
    expect(response.body.data.updateUserById.name).to.equal('Updated Admin User');
    expect(response.body.data.updateUserById.surname).to.equal('Updated');
  });


});
