// graphqlClient.js
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('http://localhost:3000/graphql', {
    headers: {
        'Content-Type': 'application/json',
    },
});


export default client; // <-- This is crucial


