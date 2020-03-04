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

import Leaderboard from "../Components/Leaderboard";

import SiteGetter from "../Components/SiteGetter";

let defaultImageUri = '../assets/RotundaBackground.png'; // the default image to display as the background of this screen (when the user is not uploading an image)

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

/**
 * CollectionScreen - The main component for the Collection screen
 */
export default class CollectionScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedSite: null,
            name: '',
            file: defaultImageUri,
            errorMsg: '',
            computingID: '',
            success: false,
            siteGetterVisible: false,
            uploading: false,
            showingLeaderboard: false
        };
        this.leaderboard = null
    }

    /**
     * Toggles whether the leaderboard overlay should be visible
     */
    toggleLeaderboard = () => {
        this.setState({
            showingLeaderboard: !this.state.showingLeaderboard
        })
    }

    /**
     * Display the siteGetter to get a site name as input from the user
     */
    showSiteGetter = () => {
        this.setState({
            siteGetterVisible: true
        })
    }

    /**
     * Update the recorded computing ID of the current user
     * @param ID - the new ID to remember
     */
    updateComputingID = ID => {
        this.setState({
            computingID: ID,
        });
    };

    /**
     * Update the currently-selected site name
     * @param value - the site name (data label) chosen
     */
    updateSiteName = value => {
        this.setState({
            selectedSite: value,
            siteGetterVisible: false
        });
    };

    /**
     * Reset the screen and discard current collection progress
     */
    back = () => {
        this.setState({
            file: defaultImageUri,
        });
    }

    /**
     * Awards the current computing ID points
     */
    incrementLeaderboardPoints = () => {
        if (this.state.computingID === '') {
            return
        }
        let ref = firebase.database().ref().child("leaderboard/" + this.state.computingID)
        ref.once("value").then((snapshot) => {
            let pointsEarned = 1 // TODO: change based on site and amount of photos already in site
            // TODO: show visual of points earned
            ref.set(snapshot.val() + pointsEarned)
            this.leaderboard && this.leaderboard.getEntries()
        })
    }

    /**
     * Upload the latest image selected with the chosen data label to Firebase
     */
    upload = () => {
        if (this.state.success === false) { // if did not just finish uploading
            // Prevent spam
            if (this.state.selectedSite != null && !this.state.uploading) { // if a site was selected and not already uploading
                if (this.state.file !== defaultImageUri) { // if an image was selected
                    let compID = this.state.computingID;
                    if (this.state.computingID === '') {
                        compID = 'ANON'; // set compID to a default value if none was provided
                    }
                    let imageUri = this.state.file;
                    this.setState({ // debounce + prevent spam
                        uploading: true
                    })
                    fetch(imageUri).then(response => { // fetch the imageUri
                        response.blob().then(blob => { // get a blob of the fetch response
                            // Construct a path/name for the image in the Firebase storage container
                            let ref = firebase
                                .storage()
                                .ref()
                                .child(
                                    this.state.selectedSite +
                                    '/' +
                                    compID +
                                    ':' +
                                    new Date().getTime() // create the name in the form compID:CurrentDateAndTime
                                );
                            // Upload
                            ref.put(blob).then(() => {
                                // Upon upload...
                                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                                    // Alert the user of success
                                    Alert.alert(
                                        'Success!',
                                        'Uploaded image for ' + this.state.selectedSite
                                    );
                                } else {
                                    // Display success
                                    this.setState({
                                        errorMsg: 'Success!',
                                    });
                                }
                                this.setState({
                                    success: true,
                                    uploading: false
                                });
                                this.incrementLeaderboardPoints()
                                // Prevent spam by waiting a certain amount of time before allowing for uploads again
                                setTimeout(() => {
                                    this.setState({
                                        success: false,
                                        errorMsg: '',
                                        uploading: false
                                    });
                                }, 1000 * 5);
                                // Reset screen to allow for collection (but not uploads, immediately)
                                this.setState({
                                    file: defaultImageUri,
                                });
                            })
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
                    <AwesomeButton
                        onPress={this.toggleLeaderboard}
                        width={2 * width / 5}
                        height={50}
                        style={styles.leaderboardButton}
                        backgroundColor={'#076c26'}
                        borderRadius={20}
                        textSize={14}
                        raiseLevel={6}
                    >Leaderboard</AwesomeButton>
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
                    <Leaderboard
                        visible={this.state.showingLeaderboard}
                        computingID={this.state.computingID}
                        onDismiss={this.toggleLeaderboard}
                        ref={(ref) => this.leaderboard = ref}
                    />
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
    },
    leaderboardButton: {
        position: 'absolute',
        left: 10,
        top: 0 + Constants.statusBarHeight
    }
});

/*
Not currently in use:

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
 */