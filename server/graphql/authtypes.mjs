import { GraphQLObjectType, GraphQLString, GraphQLSchema, GraphQLList, GraphQLBoolean } from 'graphql';
import auth from '../datamodels/auth.mjs';

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        email: { type: GraphQLString },
        admin: { type: GraphQLBoolean },
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
            description: 'Fetch user data - email and token',
            async resolve() {
                const usersData = await auth.getAllUsers();
                console.log(usersData)
                return usersData;
            },
        },
        userData: {
            type: UserType,
            description: 'Fetch user data for an user email',
            args: { email: { type: GraphQLString } },
            async resolve(_, args) {
                const userData = await auth.getdataByEmail(args.email);
                return userData;
            },
        },
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
            },
            resolve: async (_, { email, password, admin }) => {
                const response = await auth.register({ email, password, admin });
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
            },
            resolve: async (_, { email, password }) => {
                const response = await auth.login({ email, password });
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
    },
});

export default new GraphQLSchema({
    query: RootQueryType,
    mutation: Mutation,
});
