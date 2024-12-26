import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Surface, Text } from 'react-native-paper';
import UdpService from '../services/UdpService';

export const ConnectionScreen = ({ navigation }) => {
  const [ip, setIp] = useState('192.168.4.1');
  const [port, setPort] = useState('50000');
  const [error, setError] = useState('');

  const handleConnect = async () => {
    try {
      // await UdpService.connect();
      navigation.navigate('Control', { ip, port });
    } catch (err) {
      setError('Failed to initialize UDP connection');
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.form}>
        <Text style={styles.title}>Connect to Drone</Text>
        
        <TextInput
          label="IP Address"
          value={ip}
          onChangeText={setIp}
          mode="outlined"
          style={styles.input}
        />
        
        <TextInput
          label="Port"
          value={port}
          onChangeText={setPort}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <Button
          mode="contained"
          onPress={handleConnect}
          style={styles.button}
        >
          Connect
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
    justifyContent: 'center',
  },
  form: {
    padding: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: '#ff0000',
    marginBottom: 8,
  },
}); 