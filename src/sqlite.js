import { open } from '@op-engineering/op-sqlite';

let dbs = new Map();

function openDBSafely(opts) {
  console.log('🐶 openDBSafely');
  try {
    const db = open(opts);
    return db;
  } catch (err) {
    throw err;
  }
}


export const openDB = (doctype) => {
  const dbName = `paultranvan.mycozy.cloud_${doctype}.sqlite`;
  console.log('🐶 openDB locally : ', dbName);
  let db = dbs.get(dbName);
  if (db) {
    console.log('Db found in memory');
    return db;
  }
  console.log('open db safely');
  db = openDBSafely({ name: dbName });
  dbs.set(dbName, db);
  return db;
};


const parseSqliteResults = (result, key = 'data') => {
  let parsedResults = [];
  const startParse = performance.now();
  console.log('result.rows.length : ', result.rows.length);
  for (let i = 0; i < result.rows.length; i++) {
    const item = result.rows.item(i);
  const doc = JSON.parse(item[key]);
    //const id = JSON.parse(item.metadata).id;
    //doc._id = id
    doc._rev = item.rev;
    doc._id = item.doc_id;
    parsedResults.push(doc);
  }
  const endParse = performance.now();
  console.log(`Parse data took ${endParse - startParse}`);
  return parsedResults;
};

export const queryAllDataSqlite = async (doctype, limit) => {
  const db = openDB(doctype);

  const limitInt = limit ? limit : -1;
  const sql = `SELECT 'by-sequence'.seq AS seq, 'by-sequence'.deleted AS deleted, 'by-sequence'.json AS data, 'by-sequence'.rev AS rev, 'document-store'.json AS metadata FROM 'document-store' JOIN 'by-sequence' ON 'by-sequence'.seq = 'document-store'.winningseq WHERE 'by-sequence'.deleted = 0 ORDER BY 'document-store'.id ASC LIMIT ${limitInt}`;
  const startQuery = performance.now();
  const result = await db.executeAsync(sql);
  const endQuery = performance.now();
  // console.log('result query data: ', result);
  // console.log('result query data rows: ', result.rows);
  // console.log('result query data res: ', result.res);

  console.log(`Query data by op took ${endQuery - startQuery}`);

  // const startRawQuery = performance.now();
  // await db.executeRawAsync(sql);
  // const endRawQuery = performance.now();
  // console.log(`Query raw data by op took ${endRawQuery - startRawQuery}`);

  const parsedResults = parseSqliteResults(result);

  console.log('🌈 n docs sqlite', result.rows.length);

  return parsedResults;
};

export const querySingleDocSqlite = async (doctype, id) => {
  const db = openDB(doctype);
  //const sql = `SELECT 'by-sequence'.seq AS seq, 'by-sequence'.deleted AS deleted, 'by-sequence'.json AS data, 'by-sequence'.rev AS rev, 'document-store'.json AS metadata FROM 'document-store' JOIN 'by-sequence' ON 'by-sequence'.seq = 'document-store'.winningseq WHERE 'document-store'.id="${id}"`;
  const sql = `select json as data, doc_id, rev from 'by-sequence' WHERE doc_id="${id}"`;

  const startQuery = performance.now();
  const result = await db.executeAsync(sql);
  const endQuery = performance.now();
  console.log(`Query single id by op took ${endQuery - startQuery}`);

  const item = result.rows.item(0);
  const startParse = performance.now();
  const doc = JSON.parse(item.data);
  const endParse = performance.now();
  console.log(`Parse data took ${endParse - startParse}`);
  return doc;
};


const getIndexName = (fieldsToIndex) => {
  return `by_${fieldsToIndex.join('_and_')}`;
};


export const queryWithSelectorSqlite = async (doctype, fieldsToIndex, {recreate_index = false} = {}) => {
  // XXX - we could ask sqlite to tranform the 'json' column in actual json to avoid deserialization.
  // But this looks risky because we got "malformed json". Maybe related to weird [[objet]] ?
  // we could also do a select json(json) from ... , catch it, and retry withtout json conversion if error.
  const db = openDB(doctype);
  const indexName = getIndexName(fieldsToIndex);

  const sql = `select json as data, doc_id, rev from 'by-sequence' INDEXED BY ${indexName} where json_extract(json, '$.name') > 'aaaa' LIMIT 100;`;
  let result;
  const startQuery = performance.now();
  if (recreate_index) {
    await deleteIndex();
  }
  try {
    result = await db.executeAsync(sql);
  } catch (err) {
    // retry with index creation
    console.log('err : ', err);
    await createIndex(db, fieldsToIndex);
    result = await db.executeAsync(sql);
  }
  const endQuery = performance.now();
  console.log(`Query with op took ${endQuery - startQuery}`);

  const parsedResults = parseSqliteResults(result, 'data');
  console.log('🌈 n docs sqlite', result.rows.length);
  return parsedResults;
};

const deleteIndex = async (db, indexName) => {
  const sql = `DROP INDEX IF EXISTS '${indexName}'`;
  await db.executeAsync(sql);
  return;
};

const createIndex = async (db, fieldsToIndex) => {
  /*
  CREATE INDEX by_name ON 'by-sequence'(
    json_extract(json, '$.name'), json_extract(json, '$.dir_id')
);
*/
  const indexName = getIndexName(fieldsToIndex);

  const jsonAttributes = fieldsToIndex.map(
    field => `json_extract(json, '$.${field}')`,
  );
  const jsonIndex = jsonAttributes.join(',');

  const sql = `CREATE INDEX IF NOT EXISTS'${indexName}' ON 'by-sequence' (${jsonIndex})`;
  const startIndex = performance.now();
  const result = await db.executeAsync(sql);
  const endIndex = performance.now();
  console.log(`Index creation ${indexName} took ${endIndex - startIndex}`);
  console.log('result : ', result);
  return result;
};
