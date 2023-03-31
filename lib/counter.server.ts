import { Counter } from "db/models/counter.model";
import tigrisDB from "./db.server";

export async function getNextSequence(name: string) {
  const tx = await tigrisDB.beginTransaction();
  const countersCollection = tigrisDB.getCollection<Counter>("counters");
  await countersCollection.updateOne(
    {
      filter: { id: name },
      fields: { $increment: { seq: 1 } },
    },
    tx
  );
  const nextSeq = await countersCollection.findOne(
    {
      filter: { id: name },
    },
    tx
  );
  await tx.commit();
  if (!nextSeq) {
    throw "No next sequence found";
  }
  return nextSeq.seq;
}
