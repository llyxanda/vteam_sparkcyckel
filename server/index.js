// TODO Decide whether to use ES modules or not.
// const express = require('express');

import express from "express";
import * as dotenv from "dotenv"; // For secure variable handling.
import fetch from "node-fetch"; // Will be used with OAuth.

const app = express();
const port = 1337;

dotenv.config();

// OAuth variables.
const GOOGLE_OAUTH_URL = process.env.GOOGLE_OAUTH_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CALLBACK_URL = "http://localhost:1337/google/callback";
const GOOGLE_OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
];
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_ACCESS_TOKEN_URL = process.env.GOOGLE_ACCESS_TOKEN_URL;

// app.set("views", "../views");
app.set("view engine", "ejs");

app.use(express.static("../client/public"));



app.get('/', (req, res) => {
    res.render('main/test.ejs'); // Renders 'test.ejs'
});

app.get('/test-oauth', (req, res) => {
    res.render('main/test_oauth.ejs'); // Renders 'test.ejs'
});

// OAuth routes.
app.get('/oauth', async (req, res) => {
    /* 
    FIX ChatGPT recommends this approach:
    Instead of hardcoding state as "placeholder_state", generate it dynamically for each session.
    For example:
    const state = crypto.randomBytes(16).toString("hex");
    Store this value (e.g., in a session or database) and validate it upon receiving the callback.
    */
    const state = "placeholder_state";
    const scopes = GOOGLE_OAUTH_SCOPES.join(" ");
    const GOOGLE_OAUTH_CONSENT_SCREEN_URL = `${GOOGLE_OAUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&access_type=offline&response_type=code&state=${state}&scope=${scopes}`; // Using query parameters to set consent options and to create the redirect URL.
    res.redirect(GOOGLE_OAUTH_CONSENT_SCREEN_URL);
    // res.send('Sign in with Google.'); // For testing.
});

app.get('/google/callback', async (req, res) => {
    console.log('req.query', req.query);

    const { code } = req.query;
    const data = {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: "http://localhost:1337/google/callback",
        grant_type: "authorization_code",
    };

    console.log('data', data);

    const response = await fetch(GOOGLE_ACCESS_TOKEN_URL, {
        method: "POST",
        body: JSON.stringify(data)
    });

    const accessTokenData = await response.json();
    const { idToken } = accessTokenData;

    console.log('idToken', idToken);

    const tokenInfoResponse = await fetch(`${process.env.GOOGLE_TOKEN_INFO_URL}?id=${idToken}`);
    res.status(tokenInfoResponse.status).json(await tokenInfoResponse.json());

    // res.send('Google OAuth Callback URL.'); // For testing.
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Run the app
app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});
