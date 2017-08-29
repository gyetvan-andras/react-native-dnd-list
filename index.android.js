import React, { Component } from 'react'
import {
	AppRegistry
} from 'react-native'
import DnDTestScreen from './DnDTestScreen'

export default class fl_dnd extends Component {
  render() {
    return (
			<DnDTestScreen/>
    );
  }
}

AppRegistry.registerComponent('fl_dnd', () => fl_dnd);
