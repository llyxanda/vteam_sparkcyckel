
import { GraphQLObjectType, GraphQLString, GraphQLSchema, GraphQLList, GraphQLBoolean, GraphQLFloat } from 'graphql';
import auth from '../datamodels/auth.mjs';
import users from '../datamodels/users.mjs'


const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        email: { type: GraphQLString },
        admin: { type: GraphQLBoolean },
        name: {type: GraphQLString},
        surname: {type: GraphQLString},
        amount: {type: GraphQLFloat}
    },
});


const RegisterResponseType = new GraphQLObjectType({
    name: 'RegisterResponse',
    fields: {
        message: { type: GraphQLString },
        user: { type: UserType },
    },
});



const LoginResponseType = new GraphQLObjectType({
    name: 'LoginResponse',
    fields: {
        message: { type: GraphQLString },
        user: { type: UserType },
        token: { type: GraphQLString },
    },
});

const RootQueryType = new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
        usersData: {
            type: new GraphQLList(UserType),
            description: 'Fetch user data',
            async resolve() {
                const usersData = await users.getAllUsers();
                console.log(usersData)
                return usersData;
            },
        },
        userData: {
            type: UserType,
            description: 'Fetch user data for an user email',
            args: { email: { type: GraphQLString } },
            async resolve(_, args) {
                const userData = await users.getdataByEmail(args.email);
                return userData;
            },
        },
        userBalance: {
            type: GraphQLFloat,
            description: 'Fetch the balance (amount) for a user by email',
            args: { email: { type: GraphQLString } },
            async resolve(_, args) {
                const userData = await users.getdataByEmail(args.email);
                return userData ? userData.amount : null;
            },
        },
        customers: {
            type: new GraphQLList(UserType),
            description: 'Fetch user data for users where admin is false',
            async resolve() {
                try {
                    const allUsersData = await users.getAllUsers();
                    const nonAdminUsersData = allUsersData.filter(user => user.admin === false);
                    return nonAdminUsersData;
                } catch (error) {
                    console.error('Error fetching non-admin users:', error);
                    throw new Error('Failed to fetch non-admin users.');
                }
            },
        }        
    },
});


const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        register: {
            type: RegisterResponseType,
            args: {
                email: { type: GraphQLString },
                password: { type: GraphQLString },
                admin: {type: GraphQLBoolean},
                name: { type: GraphQLString },
                surname: { type: GraphQLString },
                amount: {type: GraphQLFloat}
            },
            resolve: async (_, { email, password, admin=false, name, surname }) => {
                const response = await auth.register({ email, password, admin, name, surname });
                if (response.errors) {
                    return {
                        message: response.errors.detail,
                        user: null,
                    };
                }
                return response.data;
            },
        },
        login: {
            type: LoginResponseType,
            args: {
                email: { type: GraphQLString },
                password: { type: GraphQLString },
                admin: {type: GraphQLBoolean}
            },
            resolve: async (_, { email, password, admin=false }) => {
                const response = await auth.login({ email, password, admin });
                //console.log(response)

                if (response.errors) {
                    return {
                        message: response.errors.detail || 'Login failed',
                        user: null,
                        token: null,
                    };
                }
                if (response.data) {
                    console.log('is tr', response)
                    return {
                        message: response.data.message,
                        user: { email: response.data.user.user, admin: response.data.user.admin }, 
                        token: response.data.token,
                    };
                }
                console.log('here' , response)
            },
        },
        updateBalance: {
            type: UserType,
            args: {
                email: { type: GraphQLString },
                amount: { type: GraphQLFloat },
            },
            resolve: async (_, { email, amount }) => {
                const userData = await users.getdataByEmail(email);

                if (!userData) {
                    throw new Error('User not found');
                }

                const updatedUserData = await users.updateBalance(email, amount);

                if (updatedUserData.errors) {
                    throw new Error(updatedUserData.errors.detail);
                }

                return updatedUserData;
            },
        },
    },
});

export default new GraphQLSchema({
    query: RootQueryType,
    mutation: Mutation,
});
