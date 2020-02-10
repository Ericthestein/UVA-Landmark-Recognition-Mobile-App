import React, {Component} from 'react'
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    StatusBar,
    Image,
    TouchableOpacity,
    Dimensions,
    ImageBackground
} from 'react-native'
import AwesomeButton from "react-native-really-awesome-button";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import * as Permissions from "expo-permissions";

import * as tf from '@tensorflow/tfjs';
import {fetch} from "@tensorflow/tfjs-react-native";
import * as mobilenet from '@tensorflow-models/mobilenet'
import * as FileSystem from "expo-file-system";
// import * as tfn from "@tensorflow/tfjs-node"
// const imageGet = require('get-image-data');

import * as jpeg from 'jpeg-js'

const {length, width} = Dimensions.get("window")

let defaultImageUri = '../assets/RotundaBackground.png';
let ML_Model_Link = 'https://raw.githubusercontent.com/sg2nq/TFJS_model/master/model.json' //'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'//'./tfjs/model.json' //'https://raw.githubusercontent.com/sg2nq/TFJS_model/master/model.json' //'./tfjs/model.json'

export default class PredictionScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {
            imageFile: defaultImageUri,
            predictionText: "",
            loadingPrediction: false,
            tfStatus: "Loading",
            modelStatus: "Waiting for TensorFlow"
        }
        this.getPermissionsAsync();
        this.loadTensorFlowModel()
    }

    loadTensorFlowModel = () => {
        tf.ready().then(() => {
            console.log("TensorFlow ready")
            this.setState({
                tfStatus: "Loaded ✅",
                modelStatus: "Loading"
            })
            /*
            const loader = {
                load: async () => {
                    return {
                        modelTopology: topology,
                        weightSpecs: specs
                        weightData: data,
                    };
                }
            }

            const model = await tf.loadLayersModel(loader)
             */

            // const handler = tfn.io.fileSystem(ML_Model); // set to ML_Model if using a valid online json
            tf.loadLayersModel(ML_Model_Link).then((model) => {
                this.model = model
                console.log("Model has been loaded")
                this.setState({
                    modelStatus: "Loaded ✅"
                })
            }).catch((err) => {console.log("Error loading model: " + err)})
            /*
            tf.loadModel(ML_Model).then((model) => {
                this.model = model
                console.log("Success loading model")
            }).catch(console.log)
            tf.models.modelFromJSON(ML_Model).then((model) => {
                this.model = model
                console.log("Success loading model")
            }).catch(console.log)
             */
        }).catch((err) => {console.log("Error loading TensorFlow: " + err)})
    }

    takePicture = async () => {
        ImagePicker.launchCameraAsync({
            mediaTypes: 'Images',
            allowsEditing: false,
        }).then(result => {
            if (!result.cancelled) {
                this.setState({
                    imageFile: result.uri,
                    imageData: result,
                    imageSource: {
                        uri: result.uri
                    }
                });
            }
        });
    };

    getPermissionsAsync = async () => {
        if (Constants.platform.ios) {
            const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
            if (status !== 'granted') {

            }
            const cameraStatus = await Permissions.askAsync(Permissions.CAMERA).status;
            if (cameraStatus !== 'granted') {

            }
        }
    };

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

    preprocessTensor(tensor) {

        // resize the input image to mobilenet's target size of (224, 224)

        tensor
            .resizeNearestNeighbor([224, 224])
            .toFloat();

        /*
        let offset = tf.scalar(127.5);
            return tensor.sub(offset)
                .div(offset)
                .expandDims();
         */

        return tensor.expandDims();
    }

    predict = async () => {
        // check to ensure provided file is valid
        if (this.state.imageFile === defaultImageUri) {
            this.setState({
                predictionText: "Error: no file provided"
            })
            return
        }
        // indicate loading
        this.setState({
            predictionText: "Predicting...",
            loadingPrediction: true
        })
        // get prediction
        const imageAssetPath = Image.resolveAssetSource(this.state.imageSource)
        const response = await fetch(imageAssetPath.uri, {}, { isBinary: true })
        const rawImageData = await response.arrayBuffer()
        const imageTensor = this.imageToTensor(rawImageData)
        let imageTensor2 = imageTensor.expandDims(0)
        console.log(imageTensor2)
        console.log("Predicting...")
        const predictions = await this.model.predict(imageTensor2)
        console.log("Done predicting")
        console.log(predictions.data())
        predictions.print()
        this.setState({ predictions })
                /*
                try {

                        var result = "Error"
                        try {
                            console.log("Got raw image data")
                            let imageTensor = this.imageToTensor(rawImageData) // [4023, 3024, 3];  expected input_1 to have 4 dimension(s), but got array with shape [4032,3024,3]
                            console.log(imageTensor)
                            // console.log("Got image tensor")
                            //let imageTensor2 = imageTensor.expandDims(0)
                            // console.log(imageTensor2)
                            setTimeout(() => {
                                //let imageTensor2 = imageTensor
                                console.log("expanded image tensor")
                                //console.log(imageTensor2)
                                //let imageTensor2 = this.preprocessTensor(imageTensor)
                                // console.log("preprocessed image tensor")
                                // result = this.model.predict(imageTensor2) // CAUSES CRASH
                                this.setState({
                                    predictionText: "Prediction: " + result,
                                    loadingPrediction: false
                                })
                                console.log("Prediction complete: " + result)
                                resolve(result)
                            }, 2000)

                        } catch(error) {
                            result = error
                            this.setState({
                                predictionText: "Prediction: " + result,
                                loadingPrediction: false
                            })
                            console.log(error)
                            // reject(error)
                        }
                    }).catch((err) => {
                        console.log("Error producing arrayBuffer: ", err)
                    })
                })
                /*
                fetch(this.state.imageFile, {}, {isBinary: true}).then(response => {
                    response.arrayBuffer().then((rawImageData) => {
                        const imageTensor = decodeJpeg(rawImageData);
                        let image = this.preprocessImage(imageTensor)
                        let result = this.model.predict(image)
                        this.setState({
                            predictionText: "Prediction: " + result,
                            loadingPrediction: false
                        })
                        console.log("Prediction complete: " + result)
                        resolve(result)
                    })
                })


                //const image = require(this.state.imageFile);
                //const imageAssetPath = Image.resolveAssetSource(image);

            } catch (e) {
                console.log("Error predicting: ", e)
            }
            */
    }

    classifyImage = async () => {
        try {
            const imageAssetPath = Image.resolveAssetSource(this.state.image)
            const response = await fetch2(imageAssetPath.uri, {}, { isBinary: true })
            const rawImageData = await response.arrayBuffer()
            const imageTensor = this.imageToTensor(rawImageData)
            const predictions = await this.model.classify(imageTensor)
            this.setState({ predictions })
            console.log(predictions)
        } catch (error) {
            console.log(error)
        }
    }

    render() {
        return(
            <ImageBackground
                style={styles.imageBackground}
                source={this.state.imageFile === defaultImageUri ? require(defaultImageUri) : { uri: this.state.imageFile }}
            >
                <View
                    style={styles.container}
                >
                    <View style={styles.loadingStatuses}>
                        <Text style={styles.tfLoadingStatus}>TensorFlow: {this.state.tfStatus}</Text>
                        <Text style={styles.modelLoadingStatus}>ML Model: {this.state.modelStatus}</Text>
                    </View>
                    <Text style={styles.predictionText}>{this.state.predictionText}</Text>
                    <AwesomeButton
                        onPress={this.takePicture}
                        width={2.25 * width / 5}
                        height={100}
                        style={styles.captureButton}
                        backgroundColor={'#de0000'}
                        borderRadius={20}
                        textSize={36}
                        raiseLevel={6}
                    >Capture</AwesomeButton>
                    <AwesomeButton
                        onPress={this.predict}
                        width={2.25 * width / 5}
                        height={100}
                        style={styles.predictButton}
                        backgroundColor={'#de0000'}
                        borderRadius={20}
                        textSize={36}
                        raiseLevel={6}
                    >Predict</AwesomeButton>
                </View>
            </ImageBackground>
        )
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
    captureButton: {
        alignSelf: 'center',
        position: 'absolute',
        left: 0,
        bottom: 0,
    },
    predictButton: {
        alignSelf: 'center',
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
    predictionText: {
        position: 'absolute',
        bottom: 100,
        width: '100%',
        fontSize: 20,
        color: '#ff0000',
        textAlign: 'center'
    },
    loadingStatuses: {
        position: 'absolute',
        width: '100%',
        height: '10%',
        top: '10%'
    },
    tfLoadingStatus: {
        flex: 1,
        width: '100%',
        fontSize: 20,
        color: '#ff0000',
        textAlign: 'center'
    },
    modelLoadingStatus: {
        flex: 1,
        width: '100%',
        fontSize: 20,
        color: '#ff0000',
        textAlign: 'center'
    }
})