import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import UserModel from './user.mjs';


const jwtSecret = process.env.JWTSECRET;

const auth = {
    register: async function(body) {
        const { email, password, admin, name, surname } = body;

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

        try {

            const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
            if (existingUser) {
              return {
                errors: {
                  status: 409,
                  source: "/register",
                  title: "Email already registered",
                  detail: "A user with the provided email already exists.",
                },
              };
            }
        
            // Create a new user document
            const newUser = new UserModel({
              email: email.toLowerCase(),
              password: hash,
              admin: admin || false,
              name: name || '',
              surname: surname || '',
              amount: 0,
            });
        
            // Save the new user to the database
            await newUser.save();
        
            return {
              data: {
                message: "User successfully registered.",
                user: { email: newUser.email.toLowerCase()},
              },
            };
          } catch (e) {
            return {
              errors: {
                status: 500,
                source: "/register",
                title: "Database error",
                detail: e.message,
              },
            };
          }
    },

    login: async function(body) {
        const { email, password, admin = false } = body;
    
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
    
        try {
            const user = await UserModel.findOne({ email: email.toLowerCase() });
            //console.log('user:', user)
    
            if (!user || user.admin !== admin) {
                return {
                    errors: {
                        status: 401,
                        source: "/login",
                        title: "User not found",
                        detail: "User with provided email not found or admin mismatch."
                    }
                };
            }
    
            // Compare the provided password with the stored hashed password
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
                let payload = {_id:user._id, user: user.email, admin: user.admin};
                let jwtToken = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
    
                return {
                    data: {
                        message: "User logged in",
                        user: payload,
                        token: jwtToken
                    }
                };
            }
    
            // If password doesn't match
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
        }
    },
};

export default auth;
