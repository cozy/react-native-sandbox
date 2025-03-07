import {Q} from 'cozy-client';
import {
  queryAllDataSqlite,
  querySingleDocSqlite,
  queryWithSelectorSqlite,
} from './sqlite';

const queryCozyClient = async (client, queryDef, queryName) => {
  const begin = performance.now();
  const result = await client.query(queryDef, {
    as: queryName,
  });
  const end = performance.now();
  let nDocs;
  if (!result) {
    nDocs = 0;
  } else {
    nDocs = Array.isArray(result.data) ? result.data.length : 1;
  }

  console.log('🌈 n docs CC', nDocs);
  console.log('⏰ duration CC:', end - begin);
  return result;
};

export const queryAllDoctype = async (client, limit) => {
  const queryDef = Q('io.cozy.files').limitBy(limit);
  const queryName = `io.cozy.files/${limit}`;
  await queryCozyClient(client, queryDef, queryName);

  const startSqlite = performance.now();
  await queryAllDataSqlite('io.cozy.files', limit);
  const endSqlite = performance.now();
  console.log('⏰ duration sqlite:', endSqlite - startSqlite);

};

export const querySingleDoc = async client => {

  // First, query one doc to have id
  const res = await client.queryAll(Q('io.cozy.files').limitBy(1));
  const id = res[0]._id;
  if (!id) {
    console.log('No docs found');
    return;
  }

  console.log('Found id : ', id);

  const queryDef = Q('io.cozy.files').getById(id);
  const queryName = `io.cozy.files/${id}`;
  await queryCozyClient(client, queryDef, queryName);

  const startSqlite = performance.now();
  await querySingleDocSqlite('io.cozy.files', id);
  const endSqlite = performance.now();
  console.log('⏰ duration sqlite:', endSqlite - startSqlite);
};

export const queryWithSelector = async client => {
  const fieldsToIndex = ['name'];
  const selector = {name: {$gt: 'aaaa'}};
  const queryDef = Q('io.cozy.files').where(selector).limitBy(100);
  const queryName = `io.cozy.files/${selector}`;
  await queryCozyClient(client, queryDef, queryName);

  const startSqlite = performance.now();
  await queryWithSelectorSqlite('io.cozy.files', fieldsToIndex);
  const endSqlite = performance.now();
  console.log('⏰ duration sqlite:', endSqlite - startSqlite);
};


// DPO post-training llama, RLHF
// data engeneering
// ML-ops
// model merging

/*
DPO vs fine-tuning : dépend du UC ; pour de la connaissance : SFT classique marche mieux
model merging avec merge-kit
*/