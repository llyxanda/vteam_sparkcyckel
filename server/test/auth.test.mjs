
process.env.NODE_ENV = 'test';
import request from 'supertest';
import server from '../app.mjs';
import { expect } from 'chai';
import UserModel from '../datamodels/user.mjs';


describe('Auth GraphQL API', async () => {
    before(async () => {
        // Clear database before tests and insert initial users
        await UserModel.deleteMany({});
    })
    it('should register a new user', async () => {
        const mutation = `
            mutation {
                register(email: "testuser@example3.com", password: "testpass") {
                    message
                    user {
                        email
                    }
                }
            }
        `;
        const response = await request(server)
            .post('/graphql/auth')
            .send({ query: mutation })
            .set('Accept', 'application/json');
        
        //console.log('response', response.body);

        expect(response.status).to.equal(200);
        expect(response.body.data.register).to.be.an('object');
        expect(response.body.data.register.user).to.be.an('object');
        expect(response.body.data.register.user.email).to.equal("testuser@example3.com");
    });

    it('should log in a user', async () => {
        const mutation = `
            mutation {
                login(email: "testuser@example3.com", password: "testpass") {
                    message
                    user {
                        email
                    }
                    token
                }
            }
        `;
        const response = await request(server)
            .post('/graphql/auth')
            .send({ query: mutation })
            .set('Accept', 'application/json');
        
        //console.log('resp', response.body);

        expect(response.status).to.equal(200);
        expect(response.body.data.login).to.be.an('object');
        expect(response.body.data.login.token).to.be.a('string');
        expect(response.body.data.login.user.email).to.equal("testuser@example3.com");
    });

    it('should fail to register a user with an existing email', async () => {
        const mutation = `
            mutation {
                register(email: "testuser@example3.com", password: "testpass") {
                    message
                }
            }
        `;
        const response = await request(server)
            .post('/graphql/auth')
            .send({ query: mutation })
            .set('Accept', 'application/json');
        
        //console.log('response hereeee', response.body);
        expect(response.status).to.equal(200);
        expect(response.body.data.register.message).to.include('already exists');
    });

    it('should fail to log in a user with wrong password', async function() {
        const mutation = `
            mutation {
                login(email: "testuser@example3.com", password: "wrongpass") {
                    message
                    token
                }
            }
        `;
        const response = await request(server)
            .post('/graphql/auth')
            .send({ query: mutation })
            .set('Accept', 'application/json');
        
        //console.log('resppp', response.body);
        expect(response.status).to.equal(200);
        expect(response.body.data.login.message).to.include("Password is incorrect");
        expect(response.body.data.login.token).to.equal(null);
    });
});

