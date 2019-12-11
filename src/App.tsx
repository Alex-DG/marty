/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useState, useEffect} from 'react';

import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button,
} from 'react-native';

import io from 'socket.io-client';
//@ts-ignore
import SocketIOClient from 'socket.io-client/dist/socket.io';
// import test from 'react-native-tcp'

import {
  Device,
  BleError,
  BleManager,
  Subscription,
  Service,
} from 'react-native-ble-plx';

import Header from './components/Header';
import {Colors} from 'react-native/Libraries/NewAppScreen';

import {connect, disconnect} from './services/marty';

//@ts-ignore
import base64 from 'react-native-base64';

//@ts-ignore
import net from 'react-native-tcp';

const App = () => {
  let manager: BleManager;
  let onStateChangeListener: Subscription;

  const [scan, setScan] = useState(false);
  const [device, setDevice] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  const [services, setServices] = useState<any[]>([]);
  const [characteristics, setCharacteristics] = useState<any[]>([]);

  const [signal, setSignal] = useState(false);

  const usingHermes =
    typeof HermesInternal === 'object' && HermesInternal !== null;

  const martyWifi = async () => {
    console.log('martyWifi!');

    // WORKING - https://github.com/aprock/react-native-tcp/
    // var client = new net.Socket();
    // client.connect(8008, '192.168.1.64', () => {
    //   console.log('>> Connected: 192.168.1.64:8008');
    //   client.write('Hello Marty!');
    // });

    // client.on('data', (data: any) => {
    //   console.log('>> Received: ' + data);
    //   //client.destroy(); // kill client after server's response
    // });

    // client.on('connect_error', (err: any) => {
    //   console.log('>> error123', {err});
    // });

    // client.on('error', (err: any) => {
    //   console.log('>> error!!!', {err});
    // });

    // client.on('close', () => {
    //   console.log('>> Connection closed');
    // });
    //@ts-ignore
    // if ('WebSocket' in window) {
    //   console.log('WebSocket is supported! ! !');

    //   // CLIENT IO // opt: transports: ['websocket'],
    //   // const socket = await SocketIOClient('ws://192.168.1.64:8008/');
    //   // socket.on('connect', () => {
    //   //   console.log('connected');
    //   // });

    // var socket = io('ws://192.168.1.64:8008/');
    // socket.open();
    // socket.connect();
    // socket.send('Alex');
    // socket.close();

    //   // WEB SOCKET
    //   // var ws = new WebSocket('ws://192.168.1.64:8008');
    //   // // var ws = new WebSocket('wss://192.168.1.64:8008/');
    //   // // var ws = new WebSocket('wss://echo.websocket.org/');

    //   // ws.onopen = () => {
    //   //   // connection opened
    //   //   console.log('on open!');
    //   //   const data = window.btoa('something\r\n');
    //   //   // ws.send(base64.encode('Some string to encode to base64')); // send a message
    //   // };
    //   // ws.onmessage = e => {
    //   //   // a message was received
    //   //   console.log('onmessage ', e.data);
    //   // };
    //   // ws.onerror = e => {
    //   //   // an error occurred
    //   //   //@ts-ignore
    //   //   console.log('onerror ', {
    //   //     event: e,
    //   //     message: e.message,
    //   //   });
    //   // };
    //   // ws.onclose = e => {
    //   //   // connection closed
    //   //   console.log('onclose ', {
    //   //     code: e.code,
    //   //     reason: e.reason,
    //   //   });
    //   // };
    // } else {
    //   // The browser doesn't support WebSocket
    //   console.log('WebSocket NOT supported!');
    // }
  };

  useEffect(() => {
    console.log('useEffect');

    martyWifi();

    manager = new BleManager();

    onStateChangeListener = manager.onStateChange(state => {
      console.log('onStateChange: ', state);
      if (state === 'PoweredOn') {
        martyScan();
      }
    });

    return () => {
      console.log('clean up');
      setConnected(false);
      setError('');

      manager.destroy();
      onStateChangeListener.remove();
    };
  }, []);

  const martyScan = () => {
    if (scan) {
      manager.stopDeviceScan();
      setScan(false);
    }

    setScan(true);

    if (!manager) manager = new BleManager();

    const scanTimer = setTimeout(() => {
      if (scan) {
        manager.stopDeviceScan();
        setScan(false);
        !device && setError('Marty not found');
      }
    }, 5000);

    scanTimer && clearTimeout(scanTimer);

    manager.startDeviceScan(
      null,
      null,
      async (error: BleError | null, device: Device | null) => {
        console.log('scan done', {error, device});
        if (error) {
          console.log('>>> scan error! ', {error});
          setError(error.message);
          return;
        }

        // Check if it is a device you are looking for based on advertisement data
        // or other criteria.
        if (
          (device && device.name === 'RIC') ||
          (device && device.localName === 'RIC')
        ) {
          console.log('>>> Stop device scan! Marty found ', {device});

          // Stop scanning as it's not necessary if you are scanning for one device.
          manager.stopDeviceScan();
          // Proceed with connection.
          setError('');
          setDevice(device);
        }

        setScan(false);
      },
    );
  };

  const martyConnect = async () => {
    setLoading(true);

    try {
      const {deviceConnected, services, characteristics} = await connect(
        device,
      );

      setError('');
      setConnected(true);

      setDevice(deviceConnected);
      setServices(services);
      setCharacteristics(characteristics);
    } catch (error) {
      console.log('Error marty connect ', {error});

      setDevice(null);
      setConnected(false);
      setError(error.message);
    }

    setLoading(false);
  };

  const martyDisconnect = async () => {
    setLoading(true);

    try {
      await disconnect(device);
      setError('');
    } catch (error) {
      console.log('Error marty disconnect ', {error});
      setError(error.message);
    }

    setLoading(false);
    setConnected(false);
  };

  const martySendSignal = async (status: boolean) => {
    const indexChar = 2;
    const indexNestedChar = 0;

    const deviceIdentifier =
      characteristics[indexChar][indexNestedChar].deviceID;
    const serviceUUID = characteristics[indexChar][indexNestedChar].serviceUUID;
    const characteristicUUID = characteristics[indexChar][indexNestedChar].uuid;

    console.log('Sending signal..... ', {
      manager,
      deviceIdentifier,
      serviceUUID,
      characteristicUUID,
    });

    try {
      if (!manager) manager = new BleManager();

      //@ts-ignore
      let encodedData = window.btoa('LED OFFN\r\n');
      //@ts-ignore
      if (status) encodedData = window.btoa('LED ON\r\n');

      console.log({encodedData});
      await manager.writeCharacteristicWithResponseForDevice(
        deviceIdentifier,
        serviceUUID,
        characteristicUUID,
        encodedData,
      );

      setSignal(status);
    } catch (error) {
      setError(`${error.message} => REASON: ${error.reason}`);
      console.log('Send signal error: ', {error});
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Header />
          {!usingHermes ? null : (
            <View style={styles.engine}>
              <Text style={styles.footer}>Engine: Hermes</Text>
            </View>
          )}

          <View style={styles.body}>
            {loading || scan ? (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionDescription}>
                  {scan
                    ? 'Looking for marty... Please wait.'
                    : 'Marty is busy... Please wait'}
                </Text>
              </View>
            ) : (
              <>
                {error ? (
                  <>
                    <View style={styles.sectionContainer}>
                      <Text style={styles.sectionDescription}>
                        Error: {error}
                      </Text>
                    </View>
                    <View style={styles.sectionContainer}>
                      <Button title="Scan Marty" onPress={() => martyScan()} />
                    </View>
                    {connected && (
                      <View style={styles.sectionContainer}>
                        <Button
                          disabled={!connected || !device}
                          title="Disconnect Marty"
                          onPress={() => martyDisconnect()}
                        />
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.sectionContainer}>
                      <Button
                        disabled={connected || !device}
                        title="Connect Marty"
                        onPress={() => martyConnect()}
                      />
                    </View>

                    <View style={styles.sectionContainer}>
                      <Button
                        disabled={!connected || !device}
                        title="Disconnect Marty"
                        onPress={() => martyDisconnect()}
                      />
                    </View>

                    {connected && (
                      <View style={styles.sectionContainer}>
                        <Button
                          title={signal ? 'TURN OFF LED' : 'TURN ON LED'}
                          onPress={() => martySendSignal(!signal)}
                        />
                      </View>
                    )}

                    <View style={styles.sectionContainer}>
                      {connected && device ? (
                        <Text style={styles.sectionDescription}>
                          {"d-_-b.::..:::Hello::.I'm..::Marty:::..::.d-_-b"}
                        </Text>
                      ) : (
                        <>
                          {device ? (
                            <Text style={styles.sectionDescription}>
                              Marty found but not connected yet... :'(
                            </Text>
                          ) : (
                            <Text style={styles.sectionDescription}>
                              Where is Marty?
                            </Text>
                          )}
                        </>
                      )}
                    </View>

                    {!device && (
                      <View style={styles.sectionContainer}>
                        <Button
                          disabled={scan}
                          title="Scan Marty"
                          onPress={() => martyScan()}
                        />
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  button: {
    margin: 10,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
