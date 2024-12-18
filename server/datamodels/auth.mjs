import database from '../db/database.mjs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const jwtSecret = process.env.JWTSECRET;

const auth = {
    register: async function(body) {
        const { email, password, admin } = body;

        if (!email || !password) {
            return {
                errors: {
                    status: 401,
                    source: "/register",
                    title: "Email or password missing",
                    detail: "Email or password missing in request"
                }
            };
        }

        const hash = await bcrypt.hash(password, 10).catch(err => {
            return {
                errors: {
                    status: 500,
                    source: "/register",
                    title: "bcrypt error",
                    detail: "bcrypt error"
                }
            };
        });

        let db;
        try {
            db = await database.getDb('users');

            // Check if a user with the same email already exists
            const existingUser = await db.collection.findOne({ "email": email.toLowerCase() });
            if (existingUser) {
                return {
                    errors: {
                        status: 409,
                        source: "/register",
                        title: "Email already registered",
                        detail: "A user with the provided email already exists."
                    }
                };
            }

            let updateDoc = { email: email.toLowerCase(), password: hash, admin: admin };

            // Insert the new user
            await db.collection.insertOne(updateDoc);

            return {
                data: {
                    message: "User successfully registered.",
                    user:{email: email}
                }
            };
        } catch (e) {
            return {
                errors: {
                    status: 500,
                    source: "/register",
                    title: "Database error",
                    detail: e.message
                }
            };
        } finally {
            await db.client.close();
        }
    },

    login: async function(body) {
        const { email, password } = body;

        if (!email || !password) {
            return {
                errors: {
                    status: 401,
                    source: "/login",
                    title: "Email or password missing",
                    detail: "Email or password missing in request"
                }
            };
        }

        let db;
        try {
            db = await database.getDb('users');
            const user = await db.collection.findOne({ email: email.toLowerCase() });

            if (!user) {
                return {
                    errors: {
                        status: 401,
                        source: "/login",
                        title: "User not found",
                        detail: "User with provided email not found."
                    }
                };
            }

            const result = await bcrypt.compare(password, user.password).catch(err => {
                return {
                    errors: {
                        status: 500,
                        source: "/login",
                        title: "bcrypt error",
                        detail: "bcrypt error"
                    }
                };
            });

            if (result) {
                let payload = { user: user.email, admin:user.admin };
                let jwtToken = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

                return {
                    data: {
                        message: "User logged in",
                        user: payload,
                        token: jwtToken
                    }
                };
            }

            return {
                errors: {
                    status: 401,
                    source: "/login",
                    title: "Wrong password",
                    detail: "Password is incorrect."
                }
            };
        } catch (e) {
            return {
                errors: {
                    status: 500,
                    source: "/login",
                    title: "Database error",
                    detail: e.message
                }
            };
        } finally {
            await db.client.close();
        }
    },
    getAllUsers: async function() {
        let db;
        try {
            db = await database.getDb('users');
            const users = await db.collection.find({}).toArray();
            return users.map(user => ({
                email: user.email,
                admin: user.admin,
            }));
        } catch (e) {
            return {
                errors: {
                    status: 500,
                    source: "/getAllUsers",
                    title: "Database error",
                    detail: e.message
                }
            };
        } finally {
            await db.client.close();
        }
    },

    getdataByEmail: async function(email) {
        let db;
        try {
            db = await database.getDb('users');
            const user = await db.collection.findOne({ email });
            return user;
        } catch (e) {
            return {
                errors: {
                    status: 500,
                    source: "/getUserByEmail",
                    title: "Database error",
                    detail: e.message
                }
            };
        } finally {
            await db.client.close();
        }
    },

};

export default auth;
