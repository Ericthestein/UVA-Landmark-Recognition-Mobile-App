import React, {Component} from "react"
import {View, StyleSheet, Text} from "react-native"
import {Dialog, Portal} from "react-native-paper";

import * as firebase from "firebase";

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
        console.log(this.props.data)
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
 * Processes and renders the leaderboard in an overlay
 */
export default class Leaderboard extends Component {
    constructor(props) {
        super(props)
        this.state = {
            entries: [],
        }
    }

    componentDidMount() {
        console.log("mounted")
        this.getEntries()
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
    getEntries = async () => {
        let newEntries = []

        let leaderboardDataSnapshot = await firebase.database().ref().child("leaderboard").once("value")
        let leaderboardData = leaderboardDataSnapshot.val()
        let keys = Object.keys(leaderboardData)

        for (var i = 0; i < keys.length; ++i) {
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

        this.setState({
            entries: newEntries
        })
    }

    render() {
        return(
            <Portal>
                <Dialog
                    visible={this.props.visible}
                    dismissable={true}
                    onDismiss={this.props.onDismiss}
                >
                    <Text style={styles.title}>Leaderboard</Text>
                    {this.state.entries.map((data) => {
                        return(
                            <LeaderboardEntry data={data} key={data.place} currentUserID={this.props.computingID}/>
                        )
                    })}
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

    }
})