import db from './db/db';
const keys = Object.keys(db);
console.log('Keys:', keys);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawDb = (db as any).$client?.raw || (db as any)._client;
if (rawDb) {
  console.log('rawDb exists');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.log('rawDb keys:', Object.keys(rawDb as any).slice(0, 10));
}