import React from 'react'
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    StatusBar,
    Image,
    TouchableOpacity,
    Dimensions
} from 'react-native'
import * as tf from '@tensorflow/tfjs'
import { fetch, asyncStorageIO } from '@tensorflow/tfjs-react-native'
import {AsyncStorage} from "react-native"
import * as mobilenet from '@tensorflow-models/mobilenet'
import * as jpeg from 'jpeg-js'
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'
import * as Permissions from 'expo-permissions'
import AwesomeButton from "react-native-really-awesome-button";

let ML_Model_Link = 'https://raw.githubusercontent.com/sg2nq/TFJS_model/master/model.json' //'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'//'./tfjs/model.json' //'https://raw.githubusercontent.com/sg2nq/TFJS_model/master/model.json' //'./tfjs/model.json'

let class_names = ['AcademicalVillage', 'AldermanLibrary', 'AlumniHall', 'AquaticFitnessCenter',
    'BravoHall', 'BrooksHall', 'ClarkHall', 'MadisonHall', 'MinorHall', 'NewCabellHall',
    'NewcombHall', 'OldCabellHall', 'OlssonHall', 'RiceHall', 'Rotunda', 'ScottStadium',
    'ThorntonHall', 'UniversityChapel']

const predictionsLimit = 3;

const { height, width } = Dimensions.get('window');

export default class PredictionScreenTemp extends React.Component {
    state = {
        isTfReady: false,
        isModelReady: false,
        predictions: null,
        image: null
    }

    async componentDidMount(){
        await tf.ready()
        this.setState({
            isTfReady: true
        })

        tf.loadLayersModel(ML_Model_Link).then((model) => {
            this.model = model
            console.log("Model has been loaded")
            this.setState({
                isModelReady: true
            })
            /* // AsyncStorage is null
            model.save(asyncStorageIO('landmark-model')).then((saveResults) => {
                console.log(saveResults)
            })
             */
        }).catch((err) => {console.log("Error loading model: " + err)})
        this.getPermissionAsync()
    }

    /*
    async componentDidMount() {
      await tf.ready()
      this.setState({
        isTfReady: true
      })
      this.model = await mobilenet.load()
      this.setState({ isModelReady: true })
      this.getPermissionAsync()
    }
     */

    getPermissionAsync = async () => {
        if (Constants.platform.ios) {
            const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL)
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!')
            }
        }
    }

    imageToTensor(rawImageData) {
        const TO_UINT8ARRAY = true
        const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY)
        // Drop the alpha channel info for mobilenet
        const buffer = new Uint8Array(width * height * 3)
        let offset = 0 // offset into original data
        for (let i = 0; i < buffer.length; i += 3) {
            buffer[i] = data[offset]
            buffer[i + 1] = data[offset + 1]
            buffer[i + 2] = data[offset + 2]

            offset += 4
        }

        return tf.tensor3d(buffer, [height, width, 3])
    }

    tensorResponseToString = async (tensor) => {
        let data = await tensor.data()
        let results = []
        for (var i = 0; i < data.length; i++) {
            results.push({
                className: class_names[i],
                confidence: data[i]
            })
        }
        results.sort((a,b) => {
            return b.confidence - a.confidence
        })
        return results
    }

    classifyImage = async () => {
        console.log("classifying image")
        try {
            this.setState({
                predictions: null
            })
            const imageAssetPath = Image.resolveAssetSource(this.state.image)
            console.log("got image asset path")
            const response = await fetch(imageAssetPath.uri, {}, { isBinary: true })
            console.log("got binary response")
            const rawImageData = await response.arrayBuffer()
            console.log("converted to array buffer")
            const imageTensor = this.imageToTensor(rawImageData)
            console.log("converted to tensor")
            let imageTensor2 = imageTensor.expandDims(0)
            console.log("expandedDims")
            //console.log(imageTensor2)
            console.log("Predicting...")
            const predictions = await this.model.predict(imageTensor2, {batchSize: 4, verbose: true}) // causes for subsequent camera uses to cause crash
            console.log("Done predicting")
            let results = await this.tensorResponseToString(predictions)
            let shortenedResults = [];
            for (var i = 0; i < predictionsLimit; i++) {
                results[i].rank = i + 1
                shortenedResults[i] = results[i]
            }
            this.setState({ predictions: shortenedResults })
        } catch (error) {
            console.log(error)
        }
    }

    /*
    classifyImage = async () => {
      try {
        const imageAssetPath = Image.resolveAssetSource(this.state.image)
        const response = await fetch(imageAssetPath.uri, {}, { isBinary: true })
        const rawImageData = await response.arrayBuffer()
        const imageTensor = this.imageToTensor(rawImageData)
        const predictions = await this.model.classify(imageTensor)
        this.setState({ predictions })
        console.log(predictions)
      } catch (error) {
        console.log(error)
      }
    }
     */

    selectImage = async () => {
        try {
            let response = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                aspect: [4, 3]
            })

            if (!response.cancelled) {
                const source = { uri: response.uri }
                this.setState({ image: source })
                this.classifyImage()
            }
        } catch (error) {
            console.log(error)
        }
    }

    takePicture = async() => {
        try {
            console.log("Taking picture")
            let response = await ImagePicker.launchCameraAsync({
                mediaTypes: "Images",
                allowsEditing: true, // necessary
                aspect: [4, 3]
            })
            if (!response.cancelled) {
                console.log("setting source")
                const source = {uri: response.uri}
                this.setState({
                    image: source
                });
                //setTimeout(() => {
                this.classifyImage()
                //}, 1000)
            }
        } catch (error) {
            console.log(error)
        }
    }

    renderPrediction = prediction => {
        //console.log(prediction)
        let displayConfidence = Math.round((prediction.confidence * 100) * 100)/100
        return (
            <Text key={prediction.className} style={styles.text}>
                #{prediction.rank}: {prediction.className} - {displayConfidence}%
            </Text>
        )
    }

    render() {
        const { isTfReady, isModelReady, predictions, image } = this.state

        return (
            <View style={styles.container}>
                <StatusBar barStyle='light-content' />
                <View style={styles.loadingContainer}>
                    <Text style={styles.text}>
                        TFJS ready? {isTfReady ? <Text>✅</Text> : ''}
                    </Text>

                    <View style={styles.loadingModelContainer}>
                        <Text style={styles.text}>Model ready? </Text>
                        {isModelReady ? (
                            <Text style={styles.text}>✅</Text>
                        ) : (
                            <ActivityIndicator size='small' />
                        )}
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.imageWrapper}
                    onPress={isModelReady ? this.selectImage : undefined}>
                    {image && <Image source={image} style={styles.imageContainer} />}

                    {isModelReady && !image && (
                        <Text style={styles.transparentText}>Tap to choose image</Text>
                    )}
                </TouchableOpacity>
                <View style={styles.predictionWrapper}>
                    {isModelReady && image && (
                        <Text style={styles.text}>
                            Predictions: {predictions ? '' : 'Predicting...'}
                        </Text>
                    )}

                    {isModelReady &&
                    predictions &&
                    predictions.map(p => this.renderPrediction(p))}

                </View>
                <AwesomeButton
                    onPress={isModelReady ? this.takePicture : undefined}
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