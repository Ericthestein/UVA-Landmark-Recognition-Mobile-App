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
import PredictionScreenTemp from "./Screens/PredictionScreenTemp";
import firebaseConfig from "./FirebaseConfig";

//import {FIREBASE_APIKEY, FIREBASE_AUTHDOMAIN, FIREBASE_DATABASEURL, FIREBASE_STORAGEBUCKET} from 'react-native-dotenv'

// Initialize Firebase (if not yet initialized)
/*
const firebaseConfig = {
  apiKey: FIREBASE_APIKEY,
  authDomain: FIREBASE_AUTHDOMAIN,
  databaseURL: FIREBASE_DATABASEURL,
  storageBucket: FIREBASE_STORAGEBUCKET,
};
 */

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const MainNavigator = createMaterialBottomTabNavigator({ // createBottomTabNavigator
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
  },
  /*
  PredictionScreen: {
    screen: PredictionScreen,
    navigationOptions: () => ({
      title: "Predict",
      tabBarLabel: 'Predict',
      tabBarIcon: <Icon name={"list"} size={20} color={"white"} />,
    })
  },
   */
  PredictionScreenTemp: {
    screen: PredictionScreenTemp,
    navigationOptions: () => ({
      title: "Predict",
      tabBarLabel: 'Predict',
      tabBarIcon: <Icon name={"list"} size={20} color={"white"} />,
    })
  }
}, {
  labeled: true,
  barStyle: {
    backgroundColor: '#e35e13'
  }
})

/*
transition: (
      <Transition.Together>
        <Transition.Out
            type="slide-bottom"
            durationMs={400}
            interpolation="easeIn"
        />
        <Transition.In type="fade" durationMs={500} />
      </Transition.Together>
  ),
 */

const App = createAppContainer(MainNavigator)
export default App