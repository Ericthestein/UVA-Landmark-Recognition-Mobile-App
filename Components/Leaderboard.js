import React, {Component} from "react"
import {View, StyleSheet, Text, ScrollView, Dimensions} from "react-native"
import {Dialog, Portal, RadioButton, ToggleButton} from "react-native-paper";
const { height, width } = Dimensions.get('window');

import * as firebase from "firebase";
import AwesomeButton from "react-native-really-awesome-button";

/**
 * A row-like view that renders the data of a given entry in the leaderboard
 * This includes the position of the entry relative to other entries, the computing ID of the entry,
 * and the points of the entry
 */
class LeaderboardEntry extends Component {
    constructor(props) {
        super(props)

    }

    render() {
        if (!this.props.currentUserID) this.props.currentUserID = ""
        let {key, value, place} = this.props.data
        let textColor = key === this.props.currentUserID ? 'red' : 'black'
        return(
            <View style={styles.entry}>
                <Text style={{...styles.key, color: textColor}}>#{place} {key}:</Text>
                <Text style={{...styles.value, color: textColor}}>{value}</Text>
            </View>
        )
    }
}

/**
 * A row-like view that renders the first row of the table (the column names)
 */
class LeaderboardHeading extends Component {
    constructor(props) {
        super(props)

    }

    render() {
        return(
            <View style={styles.entry}>
                <Text style={{...styles.key, color: 'blue'}}>{this.props.column1Name}</Text>
                <Text style={{...styles.value, color: 'blue'}}>{this.props.column2Name}</Text>
            </View>
        )
    }
}

/**
 * Processes and renders the leaderboard in an overlay
 */
export default class Leaderboard extends Component {
    constructor(props) {
        super(props)
        this.state = {
            userEntries: [],
            landmarkEntries: [],
            selectedMode: 'users'
        }
    }

    componentDidMount() {
        console.log("mounted")
        this.getEntries("leaderboard")
        this.getEntries("siteTotals")
    }

    /**
     * Given a list of data entries, sorts them based on point values (in descending order)
     * @param entries - an array of leaderboard data entries
     */
    sortEntries(entries) {
        entries.sort((a,b) => {
            return b.value - a.value
        })
    }

    /**
     * Pulls leaderboard from Firebase, creates an entries array, sorts the array, and updates the component's state
     * @returns {Promise<void>}
     */
    getEntries = async (dataLocation) => {
        let newEntries = []

        let leaderboardDataSnapshot = await firebase.database().ref().child(dataLocation).once("value")
        let leaderboardData = leaderboardDataSnapshot.val()
        let keys = Object.keys(leaderboardData)

        for (var i = 0; i < Math.min(100, keys.length); ++i) {
            let newEntry = {
                key: keys[i],
                value: leaderboardData[keys[i]],
                place: -1
            }
            newEntries.push(newEntry)
        }

        this.sortEntries(newEntries)

        var currPlace = 1
        newEntries.forEach((object) => {
            object.place = currPlace++
        })

        if (dataLocation === "leaderboard") {
            this.setState({
                userEntries: newEntries
            })
        } else {
            this.setState({
                landmarkEntries: newEntries
            })
        }

    }

    render() {
        return(
            <Portal>
                <Dialog
                    visible={this.props.visible}
                    dismissable={true}
                    onDismiss={this.props.onDismiss}
                    style={styles.dialog}
                >
                    <Text style={styles.title}>Leaderboard</Text>

                    <View style={styles.modesView}>
                        <AwesomeButton
                            onPress={() => {this.setState({selectedMode: 'users'})}}
                            width={2*width/5}
                            height={25}
                            backgroundColor={'#94beff'}
                            borderRadius={20}
                            textSize={14}
                            raiseLevel={3}
                        >Users</AwesomeButton>

                        <AwesomeButton
                            onPress={() => {this.setState({selectedMode: 'landmarks'})}}
                            width={2*width/5}
                            height={25}
                            backgroundColor={'#76df2d'}
                            borderRadius={20}
                            textSize={14}
                            raiseLevel={3}
                        >Landmarks</AwesomeButton>
                    </View>

                    <LeaderboardHeading
                        column1Name={this.state.selectedMode === "users" ? "User" : "Site"}
                        column2Name={this.state.selectedMode === "users" ? "Points" : "Photos"}
                    />
                    <ScrollView styles={styles.scrollView}>
                        {this.state.selectedMode === "users" ? this.state.userEntries.map((data) => {
                            return(
                                <LeaderboardEntry data={data} key={data.place} currentUserID={this.props.computingID}/>
                            )
                        }) : this.state.landmarkEntries.map((data) => {
                            return(
                                <LeaderboardEntry data={data} key={data.place} />
                            )
                        })}
                    </ScrollView>
                </Dialog>
            </Portal>
        )
    }
}

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
        fontSize: 24,
    },
    entry: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginLeft: '10%',
        marginRight: '10%',
    },
    key: {

    },
    value: {

    },
    scrollView: {

    },
    dialog: {
        height: '70%'
    },
    modesView: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    modeRadio: {
        flex: 1,
        flexDirection: 'row',
        paddingLeft: "5%",
        paddingRight: "5%",
        alignContent: 'center',
        alignItems: 'center'
    }
})