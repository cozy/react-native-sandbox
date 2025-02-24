/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import type {PropsWithChildren} from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import { CozyProvider, Q, useClient } from 'cozy-client';
import { getClient } from './src/getClient';
import { triggerPouchReplication } from './src/utils';

const Tester = () => {
  const client  = useClient();

  const doTest = async () => {
    try {

      console.log('doTest', client?.getStackClient().uri);
      const begin = performance.now()
      const result = await client?.query(Q('io.cozy.files').limitBy(100))
      const end = performance.now()
      console.log('⏰ duration:', (end - begin))
  
      console.log('🌈 result', result.data?.length)
    } catch (error) {
      console.log('error', error)
    }
  };

  return (
    <Button title="small" onPress={() => doTest()} />
  );
};

const ClientHandler = () => {
  const [client, setClient] = useState(undefined);

  useEffect(() => {
    const handleClientInit = async () => {
      try {
        console.log('🌈 getClient')
        const existingClient = await getClient();
        // existingClient.startReplicationWithDebounce()
        triggerPouchReplication(existingClient)
        console.log('🌈 existingClient', existingClient)
        setClient(existingClient || null);
      } catch (error) {
        console.log('🌈 failed to get cient', error)
        setClient(null);
      }
    };

    handleClientInit();
  }, []);

  console.log('client?', client)
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
            height: 150
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
