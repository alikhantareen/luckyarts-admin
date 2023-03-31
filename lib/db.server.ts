import { DB, Tigris } from "@tigrisdata/core";

let client: Tigris;

declare global {
  var __client: Tigris | undefined;
}

if (process.env.NODE_ENV === "production") {
  client = new Tigris();
} else {
  if (!global.__client) {
    global.__client = new Tigris();
  }
  client = global.__client;
}

const tigrisDB: DB = client.getDatabase();
export default tigrisDB;
