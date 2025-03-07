/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  Header,
} from 'react-native/Libraries/NewAppScreen';

import { CozyProvider, useClient } from 'cozy-client';
import { getClient } from './src/getClient';
import { triggerPouchReplication } from './src/utils';
import { queryAllDoctype, querySingleDoc, queryWithSelector } from './src/queries';
import { openDB } from './src/sqlite';

const Tester = () => {
  const client  = useClient();


  const doQueryTest = async ({limit = 100, isSingleDoc = false, withSelector = false} = {}) => {
    try {
      console.log('-------------- doTest', client?.getStackClient().uri);

      // Open db so it is done outside of query tests
      openDB('io.cozy.files')

      if (isSingleDoc) {
        await querySingleDoc(client);
      } else if(withSelector) {
        await queryWithSelector(client)
      } else {
        await queryAllDoctype(client, limit);
      }

    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <View>
      <Button title="Query 1" onPress={() => doQueryTest({isSingleDoc: true})} />
      <Button title="Query 100 with index" onPress={() => doQueryTest({withSelector: true})} />
      <Button title="Query 100 allDocs" onPress={() => doQueryTest({limit: 100})} />
      <Button title="Query no limit" onPress={() => doQueryTest({limit: null})} />
    </View>
  );
};

const ClientHandler = () => {
  const [client, setClient] = useState(undefined);

  useEffect(() => {
    const handleClientInit = async () => {
      try {
        console.log('🌈 getClient');
        const existingClient = await getClient();
        // existingClient.startReplicationWithDebounce()
        triggerPouchReplication(existingClient);
        console.log('🌈 existingClient', existingClient);
        setClient(existingClient || null);
      } catch (error) {
        console.log('🌈 failed to get cient', error);
        setClient(null);
      }
    };

    handleClientInit();
  }, []);

  console.log('client?', client);
  if (client) {
    return (
      <CozyProvider client={client}>
        <Tester />
      </CozyProvider>
    );
  }

  return null;
};

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: '#FF0000',//isDarkMode ? Colors.black : Colors.white,
            height: 150,
          }}>
            <ClientHandler />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
