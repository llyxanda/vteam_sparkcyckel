import 'dotenv/config';
import { MongoClient, ServerApiVersion } from 'mongodb';


//const uri = "mongodb+srv://alexandraberivoe:<db_password>@cluster0.aovbh.mongodb.net/
//?retryWrites=true&w=majority&appName=Cluster0";

const database = {
  getDb: async function getDb (collectionName) {
      let dsn = `mongodb+srv://alexandraberivoe:${process.env.DB_PASS}@cluster0.aovbh.mongodb.net/
                ?retryWrites=true&w=majority&appName=Cluster0`;

      if (process.env.NODE_ENV === 'test') {
          dsn = "mongodb://localhost:27017/test";
      }

      const client = new MongoClient(dsn, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });
      const db = await client.db();
      const collection = await db.collection(collectionName);

      return {
          collection: collection,
          client: client,
          db:db
      };
  }
};

export default database;
