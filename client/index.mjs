import axios from "axios";

const GRAPHQL_API_URL = "http://localhost:8585/graphql";


const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Mutation: Register User
const registerMutation = `
  mutation Register($email: String!, $password: String!, $name: String!, $surname: String!) {
    register(email: $email, password: $password, name: $name, surname: $surname) {
      message
      user {
        email
        name
      }
    }
  }
`;

// Mutation: Login User
const loginMutation = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      message
      token
      user {
        email
      }
    }
  }
`;

// Mutation: Update Balance
const updateBalanceMutation = `
  mutation updateBalance($email: String!, $amount: Float!) {
    updateBalance(email: $email, amount: $amount) {
      email
      amount
    }
  }
`;

// Simulate Register, Login, and Update Balance
const simulateUser = async (id) => {
  const email = `user${id}@example.com`;
  const password = `password${id}`;
  const name = `User${id}`;
  const surname = `Surname${id}`;
 
  try {
    // Register
    await new Promise((resolve) => setTimeout(resolve, randomDelay(3500, 9000)));
    const registerResponse = await axios.post( `${GRAPHQL_API_URL}/auth`, {
      query: registerMutation,
      variables: { email, password, name, surname },
    });
    console.log(`User ${id} registered:`, registerResponse.data.data.register.message);

    // Random delay
    await new Promise((resolve) => setTimeout(resolve, randomDelay(1800, 6200)));

    // Login
    const loginResponse = await axios.post(`${GRAPHQL_API_URL}/auth`, {
      query: loginMutation,
      variables: { email, password },
    });
    const token = loginResponse.data.data.login.token;
    console.log(`User ${id} logged in. Token: ${token}`);

    // Random delay
    await new Promise((resolve) => setTimeout(resolve, randomDelay(2500,9000)));

    // Update Balance
    const newAmount = Math.random() * 500;
    const updateResponse = await axios.post(
      `${GRAPHQL_API_URL}/users`,
      {
        query: updateBalanceMutation,
        variables: { email, amount: newAmount },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(`User ${id} updated balance to:`, updateResponse.data);
  } catch (error) {
    console.error(`Error with User ${id}:`, error.response?.data || error.message);
  }
};

// Simulate 1000 Users (registering, logging in, updating balances)
const simulateUsers = async () => {
  const userSimulations = [];
  for (let i = 1; i <= 10; i++) {
    userSimulations.push(simulateUser(i));
  }

  // Run all simulations concurrently
  await Promise.all(userSimulations);
};

simulateUsers();
