import React from 'react'
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    StatusBar,
    Image,
    TouchableOpacity,
    Dimensions, Platform, Alert, ImageBackground
} from 'react-native'
import {AsyncStorage} from "react-native"
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'
import * as Permissions from 'expo-permissions'
import AwesomeButton from "react-native-really-awesome-button";
import * as firebase from 'firebase';
const { height, width } = Dimensions.get('window');

// Link to the server
let SERVER_LINK = 'http://35.237.224.241/predict?msg=' //'http://35.231.33.254/predict?msg='

// Model-Friendly class names; edit these depending on your sites and how you trained your model to distinguish between classes
let class_names = ['AcademicalVillage', 'AldermanLibrary', 'AlumniHall', 'AquaticFitnessCenter',
    'BravoHall', 'BrooksHall', 'ClarkHall', 'MadisonHall', 'MinorHall', 'NewCabellHall',
    'NewcombHall', 'OldCabellHall', 'OlssonHall', 'RiceHall', 'Rotunda', 'ScottStadium',
    'ThorntonHall', 'UniversityChapel']

const predictionsLimit = 3; // The number of predicted classes to display per prediction (in order of descending confidence)

let backgroundImage = '../assets/RotundaBackground.png';

/**
 * The main component used by the Prediction screen
 */
export default class PredictionScreenUsingServer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            predictions: null,
            image: null,
            imageRef: null,
            predicting: false,
            prediction: '',
            predictionsToDisplay: [],
            error: ""
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
                        .child("temp_prediction_images/" + Date.now() + ".jpg")
                    this.setState({
                        imageRef: ref
                    })
                    // Upload
                    ref.put(blob).then(() => { // Upon upload...
                        resolve()
                    })
                });
            });
        })
    }

    getImageLink = async () => {
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
        this.setState({predicting: true})
        await this.uploadImageTemporarily()
        let imageLink = await this.getImageLink()
        let result = await fetch(SERVER_LINK + imageLink)
        if (result.status === 200) {
            let json = await result.json()
            if (json.prediction) {
                this.preparePredictionDisplay(json.prediction)
            }
        } else {
            console.warn(result)
        }
        this.setState({predicting: false})
        this.removeUploadedImage()
    }

    /**
     * Prepares this.state.predictionsToDisplay for display
     */
    preparePredictionDisplay = (predictions) => {
        let display = []

        let currentSum = 0; // for testing

        // prepare array
        let predictionClassnames = Object.keys(predictions)
        for (var i = 0; i < predictionClassnames.length; i++) {
            let className = predictionClassnames[i]
            let confidence = predictions[className]
            let displayConfidence = Math.round((confidence * 100) * 100)/100

            display.push({
                className: className,
                displayConfidence: displayConfidence
            })
            currentSum += confidence
        }

        console.log("sum: " + currentSum)

        // sort in descending order of confidence
        display.sort((a,b) => {
            return b.displayConfidence - a.displayConfidence
        })

        // truncate to only show predictionsLimit
        display = display.slice(0, predictionsLimit)

        this.setState({
            predictionsToDisplay: display
        })
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
                this.setState({ image: response.uri, error: "" })
                this.classifyImage()
            }
        } catch (error) {
            console.log(error)
            this.setState({
                error: error
            })
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

    /**
     * Allow a user to use the currently-uploaded image for training by taking it to the Collection screen
     */
    useImageForTraining = () => {
        console.log("clicked")
        this.props.navigation.navigate("CollectionScreen", {imageUri: this.state.image})
    }

    render() {
        let imageWrapperOpacity = 1//this.state.image ? 1 : 0.5;
        return (
            <View style={styles.container}>
                <ImageBackground
                    style={styles.imageBackground}
                    source={require(backgroundImage)}
                >
                    <StatusBar barStyle='light-content' />
                    <Text style={styles.title}>Predict Landmark</Text>
                    <TouchableOpacity
                        style={{...styles.imageWrapper, opacity: imageWrapperOpacity}}
                        onPress={this.selectImage}
                    >
                        {this.state.image && <Image source={{uri: this.state.image}} style={styles.imageContainer} />}
                        {!this.state.image && <Text style={styles.transparentText}>Tap to choose image</Text>}
                    </TouchableOpacity>
                    <View style={styles.predictionWrapper}>
                        <Text style={styles.predictionsTitle}>
                            {this.state.predicting ? 'Predicting...' : (this.state.predictionsToDisplay.length > 0 ? "Predictions" : "")}
                        </Text>
                        <View style={styles.predictionsContainer}>
                            {!this.state.predicting && this.state.predictionsToDisplay.map((prediction, key) => {
                                return(
                                    <Text key={key} style={styles.predictionText}>#{key + 1}: {prediction.className} - {prediction.displayConfidence}%</Text>
                                )
                            })}
                        </View>
                    </View>
                    <AwesomeButton
                        onPress={this.takePicture}
                        width={2 * width / 5}
                        height={100}
                        style={styles.takePictureButton}
                        backgroundColor={'#36de00'}
                        borderRadius={20}
                        textSize={24}
                        raiseLevel={6}
                    >Take Picture</AwesomeButton>
                    {this.state.predictionsToDisplay.length > 0 && <AwesomeButton
                        onPress={this.useImageForTraining}
                        width={4.5 * width / 5}
                        height={50}
                        style={styles.wrongButton}
                        backgroundColor={'#8948de'}
                        borderRadius={20}
                        textSize={16}
                        raiseLevel={6}
                    >Were we wrong? Press me to help train!</AwesomeButton>}
                </ImageBackground>
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
    predictionWrapper: {
        height: 100,
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-around',
        position: 'absolute',
        top: 420,
    },
    predictionsTitle: {
        color: '#ffffff',
        fontSize: 16,
        flex: 1,
    },
    predictionsContainer: {
        flex: 2,
        justifyContent: "space-around"
    },
    predictionText: {
        color: "white",
        flex: 1,
        textAlign: 'left'
    },
    loadingModelContainer: {
        flexDirection: 'row',
        marginTop: 10
    },
    title: {
        fontSize: 36,
        position: 'absolute',
        top: 60,
        color: 'white'
    },
    imageWrapper: {
        width: 280,
        height: 280,
        padding: 10,
        borderColor: '#cf667f',
        borderWidth: 5,
        borderStyle: 'dashed',
        position: 'absolute',
        top: 125,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    transparentText: {
        color: '#f11a24',
        opacity: 1,
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center'
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
    },
    takePictureButton: {
        position: 'absolute',
        bottom: 15
    },
    imageContainer: {
        backgroundColor: 'red',
        height: '100%',
        width: '100%'
    },
    wrongButton: {
        position: 'absolute',
        bottom: 140
    },
    imageBackground: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        alignItems: 'center'
    },
})