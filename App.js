import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { ConnectionScreen } from './src/screens/ConnectionScreen';
import { ControlScreen } from './src/screens/ControlScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Connection">
          <Stack.Screen 
            name="Connection" 
            component={ConnectionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Control" 
            component={ControlScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App; 