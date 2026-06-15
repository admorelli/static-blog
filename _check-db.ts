import db from './db/db';
const keys = Object.keys(db);
console.log('Keys:', keys);
// Check if raw client exists
const rawDb: any = (db as any).$client || (db as any)._client;
if (rawDb) {
  console.log('rawDb exists');
  console.log('rawDb keys:', Object.keys(rawDb).slice(0, 10));
}
