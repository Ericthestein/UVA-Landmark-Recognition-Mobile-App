// Made by Eric Stein

import * as React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome'
import IconFA5 from 'react-native-vector-icons/FontAwesome5'
import {
  StyleSheet,
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';
import {createAppContainer} from "react-navigation";
import {createMaterialBottomTabNavigator} from "react-navigation-material-bottom-tabs";
const { height, width } = Dimensions.get('window');
import * as firebase from 'firebase';
import CollectionScreen from "./Screens/CollectionScreen";
import PredictionScreen from "./Screens/PredictionScreen";
import PredictionScreenUsingServer from "./Screens/PredictionScreenUsingServer"
import firebaseConfig from "./FirebaseConfig";

// Initialize Firebase (if not yet initialized)

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Create a navigation tab at the bottom of the screen

const MainNavigator = createMaterialBottomTabNavigator({
  // Add the CollectionScreen as an option
  PredictionScreen: { // Add the PredictionScreen as an option
    screen: PredictionScreenUsingServer,
    navigationOptions: () => ({
      title: "Predict",
      tabBarLabel: 'Predict',
      tabBarIcon: <Icon name={"list"} size={20} color={"white"} />,
    })
  },
  CollectionScreen: {
    screen: CollectionScreen,
    navigationOptions: ({navigation}) => {
      return({
        title: 'Collect',
        tabBarLabel: 'Collect',
        tabBarIcon: <Icon name={"map"} size={20} color={"white"}/>,
        gesturesEnabled: true,
      })
    }
  }
}, {
  labeled: true,
  barStyle: {
    backgroundColor: '#e35e13'
  }
})

const App = createAppContainer(MainNavigator)
export default App