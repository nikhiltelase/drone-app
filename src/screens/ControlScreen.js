import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Dimensions, StatusBar, Alert } from 'react-native';
import { Surface, useTheme, Snackbar } from 'react-native-paper';
import { Joystick } from '../components/Joystick';
import UdpService from '../services/UdpService';
import * as ScreenOrientation from 'expo-screen-orientation';

export const ControlScreen = ({ route, navigation }) => {
  const { ip } = route.params;
  const theme = useTheme();
  const window = Dimensions.get('window');

  const [leftValues, setLeftValues] = useState({ x: 0, y: 0 });
  const [rightValues, setRightValues] = useState({ x: 0, y: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Connect to drone when screen loads and cleanup on unmount
  useEffect(() => {
    const connectToDrone = async () => {
      const success = await UdpService.connect(ip);
      if (!success) {
        setError('Failed to connect to drone');
        setSnackbarVisible(true);
      }
    };
    
    connectToDrone();
    
    // Setup event listeners
    UdpService.on('connected', () => {
      setIsConnected(true);
      setError('');
    });
    
    UdpService.on('disconnected', () => {
      setIsConnected(false);
      setError('Connection lost');
      setSnackbarVisible(true);
    });
    
    UdpService.on('error', (errorMsg) => {
      setError(errorMsg);
      setSnackbarVisible(true);
    });
    
    return () => {
      UdpService.disconnect(); // Cleanup UDP connection
      UdpService.removeAllListeners();
    };
  }, [ip]);

  // Update command sending interval
  useEffect(() => {
    if (!isConnected) return;

    const sendInterval = setInterval(() => {
      const success = UdpService.sendCommand(
        leftValues.x,
        leftValues.y,
        rightValues.x,
        rightValues.y
      );
      
      if (!success && isConnected) {
        setError('Failed to send command');
        setSnackbarVisible(true);
      }
    }, 50);

    return () => clearInterval(sendInterval);
  }, [leftValues, rightValues, isConnected]);

  // Force landscape orientation
  useEffect(() => {
    async function changeScreenOrientation() {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    }
    changeScreenOrientation();
    
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  // Handle joystick updates
  const handleLeftJoystick = useCallback((values) => {
    setLeftValues(values);
  }, []);

  const handleRightJoystick = useCallback((values) => {
    setRightValues(values);
  }, []);

  const getConnectionStatusColor = () => {
    if (isConnected) return '#00ff00';
    return '#ff0000';
  };

  const onDismissSnackbar = () => {
    setSnackbarVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Left Side Controls */}
      <View style={styles.sidePanel}>
        <Text style={styles.modeText}>MODE: MANUAL</Text>
        <Text style={styles.telemetryText}>
          THR: {Math.abs((leftValues.y + 1) * 50).toFixed(0)}%
        </Text>
        <Text style={styles.telemetryText}>
          YAW: {((leftValues.x) * 180).toFixed(0)}°
        </Text>
      </View>

      {/* Main Control Area */}
      <View style={styles.mainControls}>
        <View style={styles.joystickSection}>
          <Text style={styles.joystickLabel}>THROTTLE / YAW</Text>
          <Joystick 
            onMove={handleLeftJoystick}
            size={window.height * 0.4}
            disabled={!isConnected}
          />
        </View>

        <View style={styles.centerPanel}>
          <Text style={[
            styles.connectionStatus,
            { color: getConnectionStatusColor() }
          ]}>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}: {ip}:50000
          </Text>
          <View style={styles.indicators}>
            <Text style={styles.indicatorText}>
              SIGNAL: {isConnected ? 'GOOD' : 'LOST'}
            </Text>
            <Text style={styles.indicatorText}>
              TRIM: {(rightValues.x * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        <View style={styles.joystickSection}>
          <Text style={styles.joystickLabel}>PITCH / ROLL</Text>
          <Joystick 
            onMove={handleRightJoystick}
            size={window.height * 0.4}
            disabled={!isConnected}
          />
        </View>
      </View>

      {/* Right Side Panel */}
      <View style={styles.sidePanel}>
        <Text style={[styles.statusText, { color: getConnectionStatusColor() }]}>
          {isConnected ? 'ARMED' : 'DISARMED'}
        </Text>
        <Text style={styles.telemetryText}>
          PITCH: {(rightValues.y * 45).toFixed(0)}°
        </Text>
        <Text style={styles.telemetryText}>
          ROLL: {(rightValues.x * 45).toFixed(0)}°
        </Text>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={onDismissSnackbar}
        duration={3000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 10,
  },
  sidePanel: {
    width: 100,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  mainControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  joystickSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  joystickLabel: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  joystickValues: {
    marginTop: 10,
    alignItems: 'center',
  },
  valueText: {
    color: '#fff',
    fontSize: 14,
    marginVertical: 2,
  },
  connectionStatus: {
    fontSize: 16,
    marginBottom: 20,
  },
  indicators: {
    alignItems: 'center',
  },
  indicatorText: {
    color: '#fff',
    fontSize: 14,
    marginVertical: 5,
  },
  modeText: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  telemetryText: {
    color: '#fff',
    fontSize: 14,
  },
  statusText: {
    fontSize: 14,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#ff0000',
  },
}); 