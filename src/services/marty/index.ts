import {
  Device,
  BleManager,
  Service,
  Characteristic,
} from 'react-native-ble-plx';

let manager: BleManager;

interface CustomService extends Service {
  characteristic?: Characteristic | null;
}

export const initBLE = () => {
  if (!manager) manager = new BleManager();
  return manager;
};

export const connect = async (device: Device) => {
  console.log('start marty connection...', {device});

  const deviceConnected = await device.connect();
  const deviceConnectedInitalised = await deviceConnected.discoverAllServicesAndCharacteristics();
  const services = await deviceConnectedInitalised.services();

  const fetchAllCharacteristics = async (service: Service, index: number) => {
    const results = await deviceConnectedInitalised.characteristicsForService(
      service.uuid,
    );
    return results;
  };

  const allCharacteristics = async () => {
    return Promise.all(
      services.map((s: Service, index: number) =>
        fetchAllCharacteristics(s, index),
      ),
    );
  };

  const characteristics = await allCharacteristics();

  console.log({services});
  console.log({characteristics});

  console.log({deviceConnectedInitalised});

  return {
    deviceConnected: deviceConnectedInitalised,
    services,
    characteristics,
  };

  // await device
  //   .connect()
  //   .then(device => {
  //     console.log('marty connected 1 = ', {device});
  //     return device.discoverAllServicesAndCharacteristics();
  //   })
  //   .then(device => {
  //     // Do work on device with services and characteristics
  //     console.log('marty connected 2 = ', {device});
  //     return device;
  //   })
  //   .catch(error => {
  //     throw error;
  //   });
};

export const disconnect = async (device: Device) => {
  console.log('start marty cancel connection...', {device});

  const deviceDisconnected = await device.cancelConnection();

  console.log('marty disconnected = ', {deviceDisconnected});

  return deviceDisconnected;
};
