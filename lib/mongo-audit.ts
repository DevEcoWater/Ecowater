import { MongoClient, Db, ObjectId } from "mongodb";

const DB_NAME = process.env.MONGO_AUDIT_DB ?? "ecowateraudit";
const COLLECTION = "valve_events";

declare global {
  // eslint-disable-next-line no-var
  var _mongoAuditClient: MongoClient | undefined;
}

async function getDb(): Promise<Db> {
  const uri = process.env.MONGO_AUDIT_URI;
  if (!uri) throw new Error("MONGO_AUDIT_URI no configurado");

  if (!global._mongoAuditClient) {
    global._mongoAuditClient = new MongoClient(uri);
    await global._mongoAuditClient.connect();
  }
  return global._mongoAuditClient.db(DB_NAME);
}

export interface ValveEvent {
  _id?: ObjectId;
  timestamp: Date;
  user_id: string;
  user_email: string;
  action: "VALVE_OPEN" | "VALVE_CLOSE";
  meter_id: string;
  dev_eui: string | null;
  mqtt_topic: string;
  result: "SENT" | "FAILED";
  error: string | null;
}

export async function saveValveEvent(
  event: Omit<ValveEvent, "_id">
): Promise<void> {
  const db = await getDb();
  await db
    .collection(COLLECTION)
    .insertOne({ ...event, timestamp: new Date() });
}

export interface ValveEventPage {
  data: (Omit<ValveEvent, "_id"> & { id: string })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getValveHistory(
  meterId: string,
  page = 1,
  limit = 10
): Promise<ValveEventPage> {
  const db = await getDb();
  const col = db.collection<ValveEvent>(COLLECTION);
  const skip = (page - 1) * limit;
  const query = { meter_id: meterId };

  const [docs, total] = await Promise.all([
    col.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(query),
  ]);

  const data = docs.map(({ _id, ...rest }) => ({
    id: _id!.toString(),
    ...rest,
  }));

  return {
    data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
