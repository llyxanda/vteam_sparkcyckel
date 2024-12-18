import express from "express";
import fetch from "node-fetch";
import 'dotenv/config';
import crypto from 'crypto';
import session from 'express-session';
import auth from '../datamodels/auth.mjs'

const router = express.Router();
router.use(express.json());

router.use(session({
    secret: process.env.OAUTHSECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// OAuth variables.
const GOOGLE_OAUTH_URL = process.env.GOOGLE_OAUTH_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CALLBACK_URL = "http://localhost:8585/posts/google/callback";
const GOOGLE_OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
];
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_ACCESS_TOKEN_URL = process.env.GOOGLE_ACCESS_TOKEN_URL;
const GOOGLE_TOKEN_INFO_URL = process.env.GOOGLE_TOKEN_INFO_URL;

// OAuth routes.
router.get('/oauth', (req, res) => {
    // Generate a dynamic state and store it for later validation
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;

    const scopes = GOOGLE_OAUTH_SCOPES.join(" ");
    const GOOGLE_OAUTH_CONSENT_SCREEN_URL = `${GOOGLE_OAUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&access_type=offline&response_type=code&state=${state}&scope=${scopes}`;
    
    //res.redirect(GOOGLE_OAUTH_CONSENT_SCREEN_URL);  // Redirect user to Google's OAuth consent screen
    res.json({ oauthUrl: GOOGLE_OAUTH_CONSENT_SCREEN_URL });
});

// Google OAuth callback.
router.get('/google/callback', async (req, res) => {
    const { code, state } = req.query;
    //console.log("Received state:", state, code); 
    //console.log("Stored state:", req.session.oauthState);

    // Validate the state parameter to prevent CSRF attacks
    //if (state !== req.session.oauthState) {
    //    return res.status(400).send("Invalid state parameter");
    //}

    const data = new URLSearchParams();
    data.append('code', code);
    data.append('state', state);
    data.append('client_id', GOOGLE_CLIENT_ID);
    data.append('client_secret', GOOGLE_CLIENT_SECRET);
    data.append('redirect_uri', GOOGLE_CALLBACK_URL);
    data.append('grant_type', 'authorization_code');
    //console.log(data);

    try {
        // Exchange the authorization code for an access token
        const response = await fetch(GOOGLE_ACCESS_TOKEN_URL, {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data.toString()
        });

        if (!response.ok) {
            const responseBody = await response.text();  // Log the response body
            console.log('Token exchange failed:', responseBody);
            throw new Error('Failed to exchange code for access token');
        }

        const accessTokenData = await response.json();
        const { access_token, id_token } = accessTokenData;
        //console.log(access_token);
        // Get user info from Google using the ID token
        const tokenInfoResponse = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${id_token}`);

        if (!tokenInfoResponse.ok) {
            throw new Error('Failed to fetch token info');
        }

        const userInfo = await tokenInfoResponse.json();
        const email = userInfo.email;
        const result = await auth.getdataByEmail(email);
        console.log('user', userInfo);
        //console.log(result);

        //Sara: Added Redirection to the frontend
        //res.redirect(`http://localhost:3000/#/mapscooter?token=${id_token}`);
        const redirectUrl = `http://localhost:3000/#/google/callback?user=${encodeURIComponent(userInfo.email)}&token=${encodeURIComponent(access_token)}`;
        

        if (!result) {
            const registerResult = await auth.register({ email: email, password: 'generatedTempPassword', admin: false });
            if (registerResult.errors) {
                throw new Error('Failed to register user');
            }
        } 

        // Redirect to the frontend with the required query parameters
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error during OAuth process:', error);
        res.status(500).send('OAuth process failed');
    }
});

export default router;