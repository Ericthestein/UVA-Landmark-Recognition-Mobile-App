import React, {Component} from 'react'
import {Dialog, Portal, Provider} from "react-native-paper";
import AwesomeButton from "react-native-really-awesome-button"
import {Picker, Platform, View, StyleSheet} from "react-native";
import {Dropdown} from "react-native-material-dropdown";

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

export default class SiteGetter extends Component {
    constructor(props) {
        super(props)
        this.state = {
            selection: siteNames[0]
        }
    }


    onChoose = () => {
        this.props.onChoose(this.state.selection)
    }

    changeSelection = (selection) => {
        this.setState({
            selection: selection
        })
    }

    render() {
        return(
                <Portal>
                    <Dialog
                        visible={this.props.visible}
                        dismissable={false}
                    >
                        <Dialog.Title>Site Selection</Dialog.Title>
                        <Dialog.Content>
                            {(Platform.OS === 'ios' || Platform.OS === 'android') ?
                                <View
                                    style={styles.dropdownContainer}
                                >
                                    <Dropdown
                                        label={'Landmark'}
                                        data={siteNamesData}
                                        onChangeText={this.changeSelection}
                                        containerStyle={{}}
                                        pickerStyle={{}}
                                        overlayStyle={{}}
                                    />
                                </View>
                            :
                                <Picker
                                    selectedValue={this.state.selection}
                                    onValueChange={this.changeSelection}
                                    style={styles.pickerStyle}
                                    itemStyle={styles.pickerItemStyle}
                                    prompt={'Select a site...'}>
                                    {siteNames.map(siteName => {
                                        return <PickerItem siteName={siteName} />;
                                    })}
                                </Picker>
                            }
                        </Dialog.Content>
                        <Dialog.Actions>
                            <AwesomeButton
                                onPress={this.onChoose}
                                width={100}
                                height={50}
                                style={styles.doneButton}
                                backgroundColor={'#de0000'}
                                borderRadius={20}
                                textSize={20}
                                raiseLevel={6}
                            >Done</AwesomeButton>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
        )
    }
}

const styles = StyleSheet.create({
    doneButton: {

    },
    pickerStyle: {

    },
    dropdownContainer: {

    },
    pickerItemStyle: {
        width: 50,
        height: 20
    }
})