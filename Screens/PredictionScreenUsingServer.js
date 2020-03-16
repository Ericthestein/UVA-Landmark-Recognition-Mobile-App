import React from 'react'
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    StatusBar,
    Image,
    TouchableOpacity,
    Dimensions, Platform, Alert
} from 'react-native'
import {AsyncStorage} from "react-native"
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'
import * as Permissions from 'expo-permissions'
import AwesomeButton from "react-native-really-awesome-button";
import * as firebase from 'firebase';
const { height, width } = Dimensions.get('window');

// Link to the server
let SERVER_LINK = 'http://35.231.33.254/predict?msg='

// Model-Friendly class names; edit these depending on your sites and how you trained your model to distinguish between classes
let class_names = ['AcademicalVillage', 'AldermanLibrary', 'AlumniHall', 'AquaticFitnessCenter',
    'BravoHall', 'BrooksHall', 'ClarkHall', 'MadisonHall', 'MinorHall', 'NewCabellHall',
    'NewcombHall', 'OldCabellHall', 'OlssonHall', 'RiceHall', 'Rotunda', 'ScottStadium',
    'ThorntonHall', 'UniversityChapel']

const predictionsLimit = 3; // The number of predicted classes to display per prediction (in order of descending confidence)

/**
 * The main component used by the Prediction screen
 */
export default class PredictionScreenUsingServer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            predictions: null,
            image: null,
            imageRef: null
        }
    }

    /**
     * Upon screen mount, prepare for predicting
     */
    async componentDidMount(){
        this.getPermissionAsync() // ask user for permission to access the camera and image library
    }

    /**
     * Ask the user for permission to access the camera and image library
     */
    getPermissionAsync = async () => {
        if (Constants.platform.ios) {
            const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL)
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!')
            }
        }
    }

    /**
     * Upload an image to firebase storage for use in prediction
     */
    uploadImageTemporarily = () => {
        return new Promise((resolve, reject) => {
            let imageUri = this.state.image;
            fetch(imageUri).then(response => { // fetch the imageUri
                response.blob().then(blob => { // get a blob of the fetch response
                    // Construct a path/name for the image in the Firebase storage container
                    let ref = firebase
                        .storage()
                        .ref()
                        .child(new Date().getTime()) // create the name in the form compID:CurrentDateAndTime
                    this.setState({
                        imageRef: ref
                    })
                    // Upload
                    ref.put(blob).then(() => {// Upon upload...
                        resolve()
                    })
                });
            });
        })
    }

    getImageLink = () => {
        return this.state.imageRef.getDownloadURL()
    }

    /**
     * Remove the previously uploaded image
     */
    removeUploadedImage = () => {
        return new Promise((resolve, reject) => {
            if (this.state.imageRef === null) reject();
            this.state.imageRef.delete().then(() => {
                this.setState({
                    imageRef: null
                })
                resolve()
            }).catch((e) => reject(e))
        })
    }

    /**
     * Uses the server to classify an image
     * @returns {Promise<void>}
     */
    classifyImage = async() => {
        await this.uploadImageTemporarily()
        let imageLink = this.getImageLink()
        console.log("link", SERVER_LINK + imageLink)
        let result = await fetch(SERVER_LINK + imageLink)
        console.log(result)
        if (result.prediction) {
            this.setState({
                prediction: result.prediction
            })
        }
        await this.removeUploadedImage()
    }

    /**
     * Ask a user for an image from their image gallery
     * @returns {Promise<void>}
     */
    selectImage = async () => {
        try {
            // await a response
            let response = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                aspect: [4, 3]
            })

            // upon successful image receipt, classify the image
            if (!response.cancelled) {
                this.setState({ image: response.uri })
                this.classifyImage()
            }
        } catch (error) {
            console.log(error)
        }
    }

    /**
     * Allow a user to take a picture using their camera
     * @returns {Promise<void>}
     */
    takePicture = async() => {
        try {
            // await a response
            let response = await ImagePicker.launchCameraAsync({
                mediaTypes: "Images",
                allowsEditing: true, // necessary
                aspect: [4, 3]
            })
            // upon successful image receipt, classify the image
            if (!response.cancelled) {
                this.setState({
                    image: response.uri
                });
                this.classifyImage()
            }
        } catch (error) {
            console.log(error)
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <StatusBar barStyle='light-content' />
                <TouchableOpacity
                    style={styles.imageWrapper}
                    onPress={this.selectImage}>
                    {image && <Image source={image} style={styles.imageContainer} />}
                    <Text style={styles.transparentText}>Tap to choose image</Text>
                </TouchableOpacity>
                <View style={styles.predictionWrapper}>
                        <Text style={styles.text}>
                            Prediction: {predictions ? '' : 'Predicting...'}
                        </Text>
                        <Text style={styles.text}>{this.state.prediction}</Text>
                </View>
                <AwesomeButton
                    onPress={this.takePicture}
                    width={2 * width / 5}
                    height={100}
                    style={styles.captureButton}
                    backgroundColor={'#36de00'}
                    borderRadius={20}
                    textSize={24}
                    raiseLevel={6}
                >Take Picture</AwesomeButton>
                <View style={styles.footer}>

                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#171f24',
        alignItems: 'center'
    },
    loadingContainer: {
        marginTop: 80,
        justifyContent: 'center'
    },
    text: {
        color: '#ffffff',
        fontSize: 16
    },
    loadingModelContainer: {
        flexDirection: 'row',
        marginTop: 10
    },
    imageWrapper: {
        width: 280,
        height: 280,
        padding: 10,
        borderColor: '#cf667f',
        borderWidth: 5,
        borderStyle: 'dashed',
        marginTop: 40,
        marginBottom: 10,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageContainer: {
        width: 250,
        height: 250,
        position: 'absolute',
        top: 10,
        left: 10,
        bottom: 10,
        right: 10
    },
    predictionWrapper: {
        height: 100,
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center'
    },
    transparentText: {
        color: '#ffffff',
        opacity: 0.7
    },
    footer: {
        marginTop: 40
    },
    poweredBy: {
        fontSize: 20,
        color: '#e69e34',
        marginBottom: 6
    },
    tfLogo: {
        width: 125,
        height: 70
    }
})