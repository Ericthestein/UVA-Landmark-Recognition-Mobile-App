# UVA Landmark Recognition Mobile App

This repository houses the source code for the UVA Landmark Recognition App, currently available on iOS via the [App Store](https://apps.apple.com/us/app/uva-landmark-recognition/id1485524207?ls=1) and on Android via the [Google Play Store](https://play.google.com/store/apps/details?id=com.ericstein.uvalandmarkrecognition&hl=en_US).

This app has two main use cases: 
1) acquiring data for use in training a computer vision model
2) allowing users to test such a model using their camera or image library

## Data Acquisition
For data storage, this app uses Firebase. Firebase project keys can be specified in `FirebaseConfig.js`, and all relevant code used in the collection screen can be found and modified in `Screens/CollectionScreen.js`. Landmark category names can be specified in `SiteNames.js`.

## Prediction
Once the prediction screen is initialized (`Screens/PredictionScreen.js`), a model is downloaded from a pre-defined URL and loaded using [tf.js](https://www.tensorflow.org/js). Afterwards, users are able to provide an image by either selecting one from their device's image library or taking a photo using their device's camera. This image is then converted into a tensor and appropriately pre-processed to allow for prediction to occur. Upon prediction, the app displays the top-3 prediction results along with their confidence metrics.
