import CozyClient from 'cozy-client';
// @ts-ignore
import flag from 'cozy-flags';
import { RealtimePlugin } from 'cozy-realtime';

import { getLinks } from './pouchdb/getLinks';
import schema from './pouchdb/schema';
import { clientOptions } from './clientOptions';

export const getClient = async () => {
  console.log('🟣 client1', clientOptions)
  const { uri, token, oauthOptions } = clientOptions;

  console.log('🟣 client2')
  const links = getLinks();
  console.log('🟣 client3')
  const client = new CozyClient({
    uri,
    oauth: { token },
    oauthOptions,
    appMetadata: {
      slug: 'flagship',
      version: '1.1.1',
    },
    links,
    schema,
  });

  console.log('🟣 client4')
  client.getStackClient().setOAuthOptions(oauthOptions);
  console.log('🟣 client5')
  
  await client.login({
    uri,
    token,
  });
  console.log('🟣 client6')
  
  await client.registerPlugin(RealtimePlugin, {});
  console.log('🟣 client7')
  await client.registerPlugin(flag.plugin);
  console.log('🟣 client8')
  await client.plugins.flags.initializing;
  console.log('🟣 client9')

  return client;
};
