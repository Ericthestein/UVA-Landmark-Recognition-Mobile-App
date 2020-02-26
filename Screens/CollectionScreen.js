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
import {Button, Provider, TextInput} from 'react-native-paper';
import { Dropdown } from 'react-native-material-dropdown';
import { Overlay, Button as RNEButton } from 'react-native-elements';
const { height, width } = Dimensions.get('window');
import * as ImagePicker from 'expo-image-picker';
import * as firebase from 'firebase';
import * as Permissions from 'expo-permissions';
import AwesomeButton from "react-native-really-awesome-button"

import SiteGetter from "../Components/SiteGetter";

import siteNames from "../SiteNames";

// Convert into React Native Paper Dropdown data
var siteNamesData = [];
siteNames.map(val => {
    let newObject = {
        value: val,
        label: val,
    };
    siteNamesData.push(newObject);
});

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
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            console.log("CORRECT")
            return (
                <View
                    style={{
                        position: 'absolute',
                        height: 65,
                        width: width,
                        top: 10,
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
        ImagePicker.launchCameraAsync({
            mediaTypes: 'Images',
            allowsEditing: false,
        }).then(result => {
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
        return(
            <AwesomeButton
                onPress={this.onButtonPress}
                width={2 * width / 5}
                height={100}
                style={styles.captureButton}
                backgroundColor={'#de0000'}
                borderRadius={20}
                textSize={36}
                raiseLevel={6}
            >Collect</AwesomeButton>
        )
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
            <AwesomeButton
                onPress={this.props.onPress}
                width={2 * width / 5}
                height={100}
                style={styles.captureButton}
                backgroundColor={'#de0000'}
                borderRadius={20}
                textSize={36}
                raiseLevel={6}
            >Upload</AwesomeButton>
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
let defaultImageUri = '../assets/RotundaBackground.png';
export default class CollectionScreen extends React.Component {
    constructor() {
        super();
        this.state = {
            selectedSite: null,
            name: '',
            file: defaultImageUri,
            errorMsg: '',
            computingID: '',
            success: false,
            siteGetterVisible: false,
            uploading: false
        };
    }
    showSiteGetter = () => {
        this.setState({
            siteGetterVisible: true
        })
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
            siteGetterVisible: false
        });
    };

    back = () => {
        this.setState({
            file: defaultImageUri,
        });
    }

    upload = () => {
        if (this.state.success === false) {
            // Prevent spam
            if (this.state.selectedSite != null && !this.state.uploading) {
                if (this.state.file !== defaultImageUri) {
                    let compID = this.state.computingID;
                    if (this.state.computingID === '') {
                        compID = 'ANON';
                    }
                    let imageUri = this.state.file;
                    this.setState({
                        uploading: true
                    })
                    fetch(imageUri).then(response => {
                        response.blob().then(blob => {
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
                            ref.put(blob).then(() => {
                                if (Platform.OS === 'ios' || Platform.OS === 'android') {
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
                                    uploading: false
                                });
                                setTimeout(() => {
                                    this.setState({
                                        success: false,
                                        errorMsg: '',
                                        uploading: false
                                    });
                                }, 1000 * 5);
                                this.setState({
                                    file: defaultImageUri,
                                });
                            })
                            /*
                            if (Platform.OS === 'ios' || Platform.OS === 'android') {
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
                            // TODO: Notify user of success in another way?
                            this.setState({
                                file: defaultImageUri,
                            });
                             */
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
        return (
            <Provider>
                <ImageBackground
                    style={styles.imageBackground}
                    source={this.state.file === defaultImageUri ? require(defaultImageUri) : { uri: this.state.file }}>
                    <TextInput
                        style={styles.textInput}
                        //autoCompleteType={''}
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
                            <SiteGetter
                                onChoose={this.updateSiteName}
                                visible={this.state.siteGetterVisible}
                            />
                            <Text style={styles.uploadingIndicator}>{this.state.uploading ? "Uploading..." : ""}</Text>
                            <Text style={styles.siteSelectionIndicator}>{this.state.selectedSite === null ? "No Site Selected" : this.state.selectedSite}</Text>
                            <AwesomeButton
                                onPress={this.showSiteGetter}
                                width={1 * width / 5}
                                height={50}
                                style={styles.siteGetterButton}
                                backgroundColor={'#076c26'}
                                borderRadius={20}
                                textSize={14}
                                raiseLevel={6}
                            >Select Site</AwesomeButton>
                            <AwesomeButton
                                onPress={this.back}
                                width={1 * width / 5}
                                height={50}
                                style={styles.backButton}
                                backgroundColor={'#1b18de'}
                                borderRadius={20}
                                textSize={14}
                                raiseLevel={6}
                            >Cancel</AwesomeButton>
                            <UploadButton onPress={this.upload} />
                        </View>
                    )}
                </ImageBackground>
            </Provider>
        );
    }
}
/*
<SitePicker
    onChangeText={this.updateSiteName}
    selectedSite={this.state.selectedSite}
    parent={this}
/>
 */
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
        textAlign: 'center',
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
        //fontFamily: 'Futura',
    },
    textInput: {
        fontSize: 32,
        paddingRight: 0,
        textAlign: 'center',
        width: width - width / 2,
        alignSelf: 'flex-end',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        bottom: 0,
    },
    siteGetterButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
    pickerStyle: {
        width: width - width / 2,
        height: 100,
        zIndex: 2,
        position: 'absolute',
        top: height - 300,
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
        top: height - 200,
    },
    dropdownContainerStyle: {
        width: width,
        // height: 100,
        position: 'absolute',
        top: 0,
        //backgroundColor: 'white'
    },
    captureButton: {
        alignSelf: 'center',
        position: 'absolute',
        left: '30%',
        bottom: 0,
    },
    siteSelectionIndicator: {
        position: 'absolute',
        bottom: 100,
        width: '100%',
        fontSize: 20,
        color: '#ff0000',
        textAlign: 'center'
    },
    uploadingIndicator: {
        position: 'absolute',
        bottom: 140,
        width: '100%',
        fontSize: 20,
        color: '#ff0000',
        textAlign: 'center'
    }
});

/*
{
  "plugins": [
    ["@babel/plugin-transform-typescript", { "allowNamespaces": true }]
  ]
}
 */

/*
module.exports = function(api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo', "@babel/env", "@babel/preset-flow"]
  }
};
 */