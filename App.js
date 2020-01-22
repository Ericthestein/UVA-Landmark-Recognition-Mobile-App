// Made by Eric Stein
import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  Picker,
  Dimensions,
  Image,
  Platform,
  Alert,
  ImageBackground,
  TouchableHighlight,
  Snackbar,
} from 'react-native';
import Constants from 'expo-constants';
import { Button, TextInput } from 'react-native-paper';
import { Dropdown } from 'react-native-material-dropdown';
import { Overlay, Button as RNEButton } from 'react-native-elements';
const { height, width } = Dimensions.get('window');
import * as ImagePicker from 'expo-image-picker';
import * as firebase from 'firebase';
import * as Permissions from 'expo-permissions';

const siteNames = [
  'Scott Stadium',
  'Rice Hall',
  'Olsson Hall',
  'Thornton Hall',
  'Aquatic & Fitness Center',
  'Rotunda',
  'Old Cabell Hall',
  'Newcomb Hall',
  'Bravo Hall',
  'Alumni Hall',
  'Alderman Library',
  'Jefferson Hall/Hotel',
  'Pavillion VII / Colonnade Curb',
  'Madison Hall',
  'University Chapel',
  'Minor Hall',
  'New Cabell Hall',
  'Clark Hall',
  'Academical Village',
  'Brooks Hall',
];

// Convert into React Native Paper Dropdown data
var siteNamesData = [];
siteNames.map(val => {
  let newObject = {
    value: val,
    label: val,
  };
  siteNamesData.push(newObject);
});
// Initialize Firebase (if not yet initialized)
const firebaseConfig = {
  apiKey: 'AIzaSyAxbTJrB3i9cvOYdRjdowMAlLXvkJdZzVM',
  authDomain: 'uva-landmark-images.firebaseapp.com',
  databaseURL: 'https://uva-landmark-images.firebaseio.com/',
  storageBucket: 'gs://uva-landmark-images.appspot.com/',
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
class PickerItem extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Picker.Item label={this.props.siteName} value={this.props.siteName} />
    );
  }
}
class SitePicker extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    if (Platform.OS == 'ios' || Platform.OS == 'android') {
      return (
        <View
          style={{
            position: 'absolute',
            height: 65,
            x: 0,
            y: height - 65,
            paddingBottom: 100,
            bottom: 100,
            width: width,
            backgroundColor: 'white',
          }}>
          <Dropdown
            label={'Landmark'}
            data={siteNamesData}
            onChangeText={this.props.onChangeText}
            containerStyle={{ ...styles.dropdownContainerStyle, flex: 1 }}
            pickerStyle={{ flex: 1 }}
            overlayStyle={{ flex: 1 }}
          />
        </View>
      );
    } else {
      // in browser
      return (
        <Picker
          selectedValue={this.props.selectedSite}
          onValueChange={this.props.onChangeText}
          style={{
            ...styles.pickerStyle,
            position: 'absolute',
            paddingBottom: 100,
            bottom: 100,
            width: '100%',
            height: 50,
          }}
          itemStyle={styles.itemStyle}
          prompt={'Select a site...'}>
          {siteNames.map(siteName => {
            return <PickerItem siteName={siteName} />;
          })}
        </Picker>
      );
    }
  }
}
class SelectFile extends React.Component {
  constructor(props) {
    super(props);
    this.getPermissionsAsync();
  }
  onButtonPress = async () => {
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsEditing: false,
    }).then(result => {
      console.log(result);
      console.log(String(result.uri));
      if (!result.cancelled) {
        this.props.parent.setState({
          file: result.uri,
        });
        this.props.parent.forceUpdate();
      }
    });
  };
  getPermissionsAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
      }
    }
  };
  render() {
    return (
      <Button onPress={this.onButtonPress} style={styles.captureButton}>
        Select Image
      </Button>
    );
  }
}
class TakePicture extends React.Component {
  constructor(props) {
    super(props);
    this.getPermissionsAsync();
  }
  onButtonPress = async () => {
    console.log('camera pressed');
    ImagePicker.launchCameraAsync({
      mediaTypes: 'Images',
      allowsEditing: false,
    }).then(result => {
      console.log('result got?');
      console.log(result);
      console.log(String(result.uri));
      if (!result.cancelled) {
        this.props.parent.setState({
          file: result.uri,
        });
        this.props.parent.forceUpdate();
      }
    });
  };
  getPermissionsAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
      }
      const cameraStatus = await Permissions.askAsync(Permissions.CAMERA)
        .status;
      if (cameraStatus !== 'granted') {
      }
    }
  };
  render() {
    return (
      <Button
        color="black"
        onPress={this.onButtonPress}
        style={styles.captureButton}
        contentStyle={{
          borderRadius: 200,
          backgroundColor: 'chartreuse',
          height: 200,
          width: 200,
        }}>
        <Text style={styles.circleButton}>{'COLLECT'}</Text>
      </Button>
    );
  }
}
/*
<Text style={{ justifyContent: 'center' }}>
      <Text style={{ flex: 1, fontSize: 36, paddingTop: 20 }}>COLLECT</Text>
      <Text style={{ flex: 1, fontSize: 24 }}>Image</Text>
    </Text>
    */
class UploadButton extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Button
        color="black"
        onPress={this.props.onPress}
        style={{
          alignSelf: 'center',
          color: 'green',
          paddingBottom: 10,
          bottom: 10,
          flex: 1,
          position: 'absolute',
          y: height - 200,
          //borderColor: 'black',
          //borderWidth: 2
        }}
        contentStyle={{
          backgroundColor: 'chartreuse',
          height: 100,
          width: width,
          flex: 1,
          alignSelf: 'flex-end',
        }}>
        <Text style={{ justifyContent: 'center' }}>
          <Text style={{ flex: 1, fontSize: 36 }}>Upload</Text>
        </Text>
      </Button>
    );
  }
}
class ResultOverlay extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Overlay
        isVisible={this.props.success}
        windowBackgroundColor=""
        overlayBackgroundColor="">
        <Text>Hello from Overlay!</Text>
      </Overlay>
    );
  }
}
let defaultImageUri = 'https://firebasestorage.googleapis.com/v0/b/uva-landmark-images.appspot.com/o/UVA%20Historical%20Landmark%20Recognition%20App%20Background%20copy.png?alt=media&token=a70e7b1c-5301-45d5-bf64-8c12b9bee883';
export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedSite: siteNames[0],
      name: '',
      file: defaultImageUri,
      errorMsg: '',
      computingID: '',
      success: false,
    };
  }
  updateName = name => {
    this.setState({
      name: name,
    });
  };
  updateComputingID = ID => {
    this.setState({
      computingID: ID,
    });
  };
  updateSiteName = value => {
    this.setState({
      selectedSite: value,
    });
    console.log(value);
  };

  back = () => {
    this.setState({
      file: defaultImageUri,
    });
  }

  upload = () => {
    if (this.state.success == false) {
      // Prevent spam
      if (this.state.selectedSite != null) {
        if (this.state.file != defaultImageUri) {
          let compID = this.state.computingID;
          if (this.state.computingID == '') {
            compID = 'ANON';
          }
          console.log('uploading image');
          let imageUri = this.state.file;
          console.log('imageUri: ' + imageUri);
          fetch(imageUri).then(response => {
            console.log('GOT RESPO');
            console.log(response);
            response.blob().then(blob => {
              console.log(blob);
              let ref = firebase
                .storage()
                .ref()
                .child(
                  this.state.selectedSite +
                    '/' +
                    compID +
                    ':' +
                    new Date().getTime()
                );
              ref.put(blob);
              if (Platform.OS == 'ios' || Platform.OS == 'android') {
                Alert.alert(
                  'Success!',
                  'Uploaded image for ' + this.state.selectedSite
                );
              } else {
                this.setState({
                  errorMsg: 'Success!',
                });
              }
              this.setState({
                success: true,
              });
              setTimeout(() => {
                this.setState({
                  success: false,
                  errorMsg: '',
                });
              }, 1000 * 5);
              console.log('SUCCESS');
              // TODO: Notify user of success in another way?
              this.setState({
                file: defaultImageUri,
              });
              // this.forceUpdate()
            });
          });
          this.setState({
            errorMsg: '', // Hide error message
          });
        } else {
          this.setState({
            errorMsg: 'No Image Uploaded',
          });
        }
      } else {
        this.setState({
          errorMsg: 'No Site Selected',
        });
      }
    }
  };
  render() {
    console.log(this.state.file === defaultImageUri);
    return (
      <ImageBackground
        style={styles.imageBackground}
        source={{ uri: this.state.file }}>
        <TextInput
          style={styles.textInput}
          autoCompleteType={''}
          defaultValue={''}
          onChangeText={this.updateComputingID}
          value={this.state.computingID}
          label={'Computing ID'}
        />
        {this.state.file === defaultImageUri && ( // Picture not yet taken
          <View style={styles.container}>
            <Text style={styles.title}>
              UVA Historical Landmark Recognition
            </Text>
            <TakePicture parent={this} />
          </View>
        )}
        {this.state.file !== defaultImageUri && ( // Picture taken
          <View
            style={{
              ...styles.container,
              alignContent: 'center',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1,
            }}>
            <SitePicker
              onChangeText={this.updateSiteName}
              selectedSite={this.state.selectedSite}
              parent={this}
            />
            <Button
              color="white"
              onPress={this.back}
              style={{
                //alignSelf: 'center',
                //paddingBottom: 10,
                top: -55,
                left: 0,
                flex: 1,
                position: 'absolute',
                y: 0,
                //borderColor: 'black',
                //borderWidth: 2
              }}
              contentStyle={{
                backgroundColor: 'blue',
                height: 100,
                width: width/2 - 20,
                flex: 1,
                color: 'white',
                textColor: 'white'
              }}>
              <Text style={{ justifyContent: 'center' }}>
                <Text style={{ flex: 1, fontSize: 36 }}>Back</Text>
              </Text>
            </Button>
            <UploadButton onPress={this.upload} />
          </View>
        )}
      </ImageBackground>
    );
  }
}
// <TextInput style={styles.textInput} autoCompleteType={'name'} defaultValue={""} onChangeText={this.updateName} value={this.state.name} label={"Name"}/>
/* <Text
      style={{
        ...styles.errorMsg,
        color: (this.state.success && 'green') || 'red',
      }}>
      {(!this.state.success &&
        this.state.errorMsg &&
        'Error: ' + this.state.errorMsg) ||
        this.state.errorMsg}
    </Text>
    */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    // backgroundColor: '#ecf0f1',
    padding: 8,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    alignItems: 'center',
    alignText: 'center',
  },
  title: {
    fontSize: 30,
    flex: 0.3,
    textAlign: 'center',
    width: width,
    position: 'absolute',
    padding: 0,
    top: 5,
    left: 0,
    color: 'white',
    textShadowColor: 'black',
    textShadowOffset: { width: 5, height: 5 },
    textShadowRadius: 10,
    fontFamily: 'futura',
  },
  textInput: {
    fontSize: 32,
    paddingRight: 0,
    textAlign: 'center',
    width: width - width / 2,
    alignSelf: 'flex-end',
  },
  backButton: {
    fontSize: 32,
    left: -10,
    top: -40,
    textAlign: 'center',
    width: width - width / 2,
    height: 10,
    position: 'absolute'
  },
  pickerStyle: {
    width: width - width / 2,
    height: 100,
    zIndex: 2,
    position: 'absolute',
    y: height - 300,
  },
  imageStyle: {
    height: 200,
    width: 300,
  },
  errorMsg: {
    color: 'red',
    flex: 0.1,
  },
  itemStyle: {
    width: width - width / 2,
    height: 100,
    zIndex: 3,
    position: 'absolute',
    y: height - 200,
  },
  dropdownContainerStyle: {
    width: width,
    // height: 100,
    position: 'absolute',
    y: height - 100,
    //backgroundColor: 'white'
  },
  captureButton: {
    alignSelf: 'center',
    position: 'absolute',
    x: width / 2,
    //y: height / 2,
    bottom: 30,
    color: 'green',
    borderColor: 'black',
    borderWidth: 0,
    borderRadius: 100,
    shadowColor: 'black',
    shadowOffset: { width: 5, height: 5 },
    shadowRadius: 10,
  },
  circleButton: {
    flex: 1,
    fontSize: 36,
    paddingTop: 20,
    fontFamily: 'futura',
    color: 'white',
    textShadowColor: 'black',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    width: 100,
    height: 100,
  },
});
