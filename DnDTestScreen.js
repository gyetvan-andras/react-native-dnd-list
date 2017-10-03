import React, { Component, PropTypes } from 'react'
import {
	StyleSheet,
	Text,
	View,
	TouchableWithoutFeedback,
	Alert,
	PanResponder,
	ScrollView,
	Animated,
	Easing, Platform, TouchableOpacity,
	LayoutAnimation
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
// import Icon from 'react-native-vector-icons/SimpleLineIcons'
import { Row, Column as Col } from 'react-native-responsive-grid'
import uuid from 'uuid'

const ROW_COUNT = 20
const SCROLL_BY = 15

const arrayMove = (arr, old_index, new_index) => {
	if (new_index >= arr.length) {
		var k = new_index - arr.length;
		while ((k--) + 1) {
			arr.push(undefined);
		}
	}
	arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
	return arr; // for testing purposes
}

class DraggableRowComponent extends Component {
	_editable = false
	_scrollDelta = 0

	get editable() {
		return this._editable
	}

	get scrollDelta() {
		return this._scrollDelta
	}
	set scrollDelta(sd) {
		this._scrollDelta = sd
		this.scrollDeltaAnim.setValue(this.scrollDelta)
	}

	set editable(e) {
		this._editable = e
		let self = this
		Animated.timing(
			this.editAnim,
			{
				toValue: this._editable ? 40 : 0,
				easing: Easing.linear,
				duration: 100,
				// useNativeDriver: true
			}
		).start(() => {
			self.setState({ editable: e })
		})
	}

	static contextTypes = {
		shellContext: React.PropTypes.any,
	}

	constructor(props) {
		super(props)
		// this.lastStart = 0
		this.dragging = false
		this._editable = props.editable
		this.editAnim = new Animated.Value(this._editable ? 40 : 0)
		this.scrollDeltaAnim = new Animated.Value(0)
		this.dragAnim = new Animated.Value(0)
		this.drag_anim_pos = 0
		this.anim = new Animated.Value(0)
		this.offset = new Animated.Value(0)
		this.offset_val = 0
		this.pace_maker = new Animated.Value(0)
		this.pace_maker_val = 0
		this.state = {
			zIndex: 0,
			editable: false
		}
	}

	get start() {
		let _start = 0
		for (let i = 0; i < this.props.idx; i++) {
			_start += this.context.shellContext.itemSize(i)
		}
		return _start
	}

	get screenPos() {
		return this.start + this.offset_val + this.pace_maker_val + this.drag_anim_pos + this._scrollDelta
	}

	get size() {
		return this.context.shellContext.itemSize(this.props.idx)
	}

	containsPosition = (middle) => {
		let start = this.start + this.offset_val + this.pace_maker_val
		let bottom = start + this.size
		return (middle >= start && middle <= bottom)
	}

	positionInUpper = (middle) => {
		let start = this.start + this.offset_val + this.pace_maker_val
		return middle <= start + (this.size / 2)
	}

	componentWillMount() {
		let self = this
		this._panResponder = PanResponder.create({
			onStartShouldSetPanResponder: (evt, gestureState) => {
				// console.log('onStartShouldSetPanResponder', gestureState.dx, gestureState.dy)
				return true
			},
			onStartShouldSetPanResponderCapture: (evt, gestureState) => {
				// console.log('onStartShouldSetPanResponderCapture', gestureState.dx, gestureState.dy)
				// self.lastStart = Date.now()
				if (this.context.shellContext.props.horizontal) {
					self.dragStarter = setTimeout(() => {
						self.dragging = true
						self._dragStart(gestureState)
						self.dragStarter = null
					}, 200)
				} else {
					self.dragging = true
					self._dragStart(gestureState)
				}
				return true
			},
			onMoveShouldSetPanResponder: (evt, gestureState) => {
				// console.log('onMoveShouldSetPanResponder', gestureState.dx, gestureState.dy)
				return true
			},
			onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
				// console.log('onMoveShouldSetPanResponderCapture', gestureState.dx, gestureState.dy)
				// self.lastStart = Date.now()
				return true
			},
			onPanResponderGrant: (evt, gestureState) => {
				// self._dragStart(gestureState)
			},
			onPanResponderMove: (evt, gestureState) => {
				if (self.dragStarter) {
					clearTimeout(self.dragStarter)
					self.dragStarter = null
				} else if (self.dragging) {
					self._dragMove(gestureState)
				}
			},
			onPanResponderTerminationRequest: (evt, gestureState) => false,
			onPanResponderRelease: (evt, gestureState) => {
				// console.log('Ellapsed ', Date.now() - self.lastStart)
				if (self.dragging) self._dragDrop(gestureState)
				self.dragging = false
				// self.lastStart = 0
				if (self.dragStarter) {
					clearTimeout(self.dragStarter)
					self.dragStarter = null
				}
			},
			onPanResponderTerminate: (evt, gestureState) => {
				// console.log('Ellapsed ', Date.now() - self.lastStart)
				if (self.dragging) self._dragCancel(gestureState)
				self.dragging = false
				// self.lastStart = 0
				if (self.dragStarter) {
					clearTimeout(self.dragStarter)
					self.dragStarter = null
				}
			},
			onShouldBlockNativeResponder: (evt, gestureState) => {
				return true;
			},
		})
		this.context.shellContext._registerDraggableRow(this)
	}

	componentWillUnmount() {
		this.context.shellContext._unregisterDraggableRow(this)
	}

	_dragStart = (gestureState) => {
		// console.log('drag start', gestureState)
		if (this.context.shellContext.isDraggable(this)) {
			this.context.shellContext.setScrollEnabled(false)
			this.context.shellContext._dragStart(gestureState, this)
			this.setState({ zIndex: 1000 }, () => {
				Animated.spring(this.anim,
					{
						toValue: 0,
						velocity: 2,
						tension: -10,
						friction: 1,
						// 1 useNativeDriver: true
					}
				).start()
			})
		}
	}

	_dragMove = (gestureState) => {
		// console.log('drag move', JSON.stringify(gestureState, null, 2))
		if (this.context.shellContext.isDraggable(this)) {
			if (this.context.shellContext.props.horizontal) {
				this.dragAnim.setValue(gestureState.dx)
				this.drag_anim_pos = gestureState.dx
			} else {
				this.dragAnim.setValue(gestureState.dy)
				this.drag_anim_pos = gestureState.dy
			}
			this.context.shellContext._dragMove(gestureState, this)
		}
	}

	_dragDrop = (gestureState) => {
		// console.log('drag end', gestureState.dy)
		this.context.shellContext.setScrollEnabled(true)
		if (this.context.shellContext._dragDrop(gestureState, this)) {
			this.dragAnim.setValue(0)
			this.drag_anim_pos = 0
		} else {
			this.context.shellContext._dragCancel(gestureState, this)
			this._moveBack()
		}
	}

	_dragCancel = (gestureState) => {
		// console.log('drag cancel')
		this.context.shellContext.setScrollEnabled(true)
		this.context.shellContext._dragCancel(gestureState, this)
		this._moveBack()
	}

	_moveBack = () => {
		this.drag_anim_pos = 0
		Animated.parallel([
			Animated.timing(
				this.dragAnim,
				{
					toValue: 0,
					easing: Easing.linear,
					duration: 500,
				}
			),
			Animated.timing(
				this.scrollDeltaAnim,
				{
					toValue: 0,
					easing: Easing.linear,
					duration: 500,
				}
			)]
		).start(() => {
			this.setState({ zIndex: 0 })
		})

	}

	_makePace = (forItemSize) => {
		this.pace_maker_val = forItemSize
		Animated.timing(
			this.pace_maker,
			{
				toValue: forItemSize,
				easing: Easing.linear,
				duration: 300,
				// 1 useNativeDriver: true
			}
		).start()
	}

	_hidePace = () => {
		this.pace_maker_val = 0
		Animated.timing(
			this.pace_maker,
			{
				toValue: 0,
				easing: Easing.linear,
				duration: 300,
				// 1 useNativeDriver: true
			}
		).start()
	}

	moveUp = (forItemSize) => {
		this.offset_val = -forItemSize
		Animated.timing(
			this.offset,
			{
				toValue: this.offset_val,
				easing: Easing.linear,
				duration: 600,
				// useNativeDriver: true
			}
		).start()
	}

	moveDown = () => {
		this.offset_val = 0
		Animated.timing(
			this.offset,
			{
				toValue: this.offset_val,
				easing: Easing.linear,
				duration: 600,
				// useNativeDriver: true
			}
		).start()
	}

	_delete = () => {
		this.context.shellContext.deleteRow(this)
	}

	render() {
		let handler_style = {
			width: this.editAnim,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			position: 'absolute',
			top: 0,
			bottom: this.context.shellContext.props.horizontal ? 0 : null,
			backgroundColor: '#40413adf',
			height: this.context.shellContext.props.horizontal ? null : this.size,
		}

		let base_style = null
		let animation_style = null
		if (this.context.shellContext.props.horizontal) {
			base_style = {
				position: 'absolute',
				top: 0,
				bottom: 0,
				left: this.start,
				width: this.size,
				flexDirection: 'row',
				justifyContent: 'center',
				backgroundColor: 'white',
			}
			animation_style = {
				transform: [
					{
						translateX: Animated.add(Animated.add(Animated.add(this.dragAnim, this.offset), this.pace_maker), this.scrollDeltaAnim)
					},
					{
						scale: this.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] })
					}
				],
			}
		} else {
			base_style = {
				position: 'absolute',
				top: this.start,
				height: this.size,
				right: 0,
				left: 0,
				flexDirection: 'row',
				justifyContent: 'center',
				backgroundColor: 'white',
			}
			animation_style = {
				transform: [
					{
						translateY: Animated.add(Animated.add(Animated.add(this.dragAnim, this.offset), this.pace_maker), this.scrollDeltaAnim)
					},
					{
						scale: this.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] })
					}
				],
			}
		}
		if (Platform.OS === 'android') {
			animation_style.elevation = this.state.zIndex === 0 ? 0 : 2
		} else {
			animation_style.zIndex = this.state.zIndex
		}
		let rowContent = this.context.shellContext.renderRow(this.props.item)
		let dragHandle = null
		let draggable = this.context.shellContext.isDraggable(this)
		if (!this.context.shellContext.props.noDragHandle) {
			if (draggable) {
				dragHandle = (
					<Animated.View style={[handler_style, { left: 0 }]} {...this._panResponder.panHandlers}>
						<View style={{ paddingVertical: 10 }} >
							<Icon name="ios-reorder" style={{ fontSize: 22, color: 'white' }} />
						</View>
					</Animated.View>
				)
			} else {
				dragHandle = <Animated.View style={[handler_style, { left: 0, backgroundColor: 'transparent' }]} />
			}
		}
		let deleteHandle = null
		if (this.context.shellContext.isDeletable(this)) {
			deleteHandle = (
				<Animated.View style={[handler_style, { right: 0 }]}>
					<TouchableOpacity onPress={this._delete} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: this.size }}>
						<View style={{ paddingVertical: 10 }} >
							<Icon name="ios-remove-circle-outline" style={{ fontSize: 22, color: 'white' }} />
						</View>
					</TouchableOpacity>
				</Animated.View>
			)
		} else {
			deleteHandle = <Animated.View style={[handler_style, { left: 0, backgroundColor: 'transparent' }]} />
		}
		if (this.context.shellContext.props.noDragHandle) {
			if (this._editable || !draggable) {
				return (
					<Animated.View style={[base_style, animation_style]}>
						<View style={{ flex: 1, flexDirection: 'row' }}>
							{rowContent}
							{deleteHandle}
						</View>
					</Animated.View>
				)
			} else {
				return (
					<Animated.View style={[base_style, animation_style]}>
						<View style={{ flex: 1, flexDirection: 'row' }} {...this._panResponder.panHandlers}>
							{rowContent}
							{deleteHandle}
						</View>
					</Animated.View>
				)
			}
		} else {
			return (
				<Animated.View style={[base_style, animation_style]}>
					<View style={{ flex: 1, flexDirection: 'row' }}>
						{rowContent}
						{dragHandle}
						{deleteHandle}
					</View>
				</Animated.View>
			)
		}
	}
}

class DnDList extends Component {
	static propTypes = {
		itemSizes: PropTypes.array.isRequired,
		// itemSize: PropTypes.func.isRequired,
		rows: PropTypes.array.isRequired,
		renderRow: PropTypes.func.isRequired,
		isDraggable: PropTypes.func.isRequired,
		isDeletable: PropTypes.func.isRequired,
		isAcceptItem: PropTypes.func.isRequired,
		handleDrop: PropTypes.func.isRequired,
		horizontal: PropTypes.any,
		noDragHandle: PropTypes.any,
		startDrag: PropTypes.func,
		stopDrag: PropTypes.func,
	}

	_editable = false
	scrollDelta = 0

	constructor(props) {
		super(props)
		this.state = {
			scrollEnabled: true,
			rows: props.rows,
		}
		this.draggableRows = []
		this.currentPaceMakerRow = null
		this.scrollContentOffset = { y: 0, x: 0 }
	}

	get editable() {
		return this._editable
	}

	set editable(e) {
		this._editable = e
		this.draggableRows.forEach((dr) => {
			dr.editable = e
		})
	}

	getChildContext() {
		return { shellContext: this }
	}

	static childContextTypes = {
		shellContext: React.PropTypes.any
	}

	_registerDraggableRow = (draggableRow) => {
		// console.log('Register',draggableRow.props.item)
		this.draggableRows.push(draggableRow)
	}

	_unregisterDraggableRow = (draggableRow) => {
		// console.log('Unregister',draggableRow.props.item)
		let idx = this.draggableRows.indexOf(draggableRow)
		if (idx != -1) this.draggableRows.splice(idx, 1)
	}

	setScrollEnabled = (enabled) => {
		this.setState({ scrollEnabled: enabled })
	}

	renderRow = (item) => {
		return this.props.renderRow(item)//<RowContent item={item}/>
	}

	_renderRows = () => {
		return this.state.rows.map((item, idx, items) => {
			return (
				<DraggableRowComponent key={item.key} item={item} idx={idx} editable={this.editable} />
			)
		})
	}

	_dragStart = (gestureState, draggableRow) => {
		let itemIdx = draggableRow.props.idx
		for (let i = itemIdx + 1; i < this.draggableRows.length; i++) {
			let dr = this.draggableRows[i]
			dr.moveUp(draggableRow.size)
		}
		if(this.props.startDrag) this.props.startDrag()
		draggableRow.scrollDelta = 0
		this._dragMove(gestureState, draggableRow)
	}
	_reset = (draggableRow) => {
		this.scrollDelta = 0
		let itemIdx = draggableRow.props.idx
		for (let i = itemIdx + 1; i < this.draggableRows.length; i++) {
			let dr = this.draggableRows[i]
			dr.moveDown()
		}
		if (this.currentPaceMakerRow) {
			for (let i = this.currentPaceMakerRow.props.idx; i < this.draggableRows.length; i++) {
				let dr = this.draggableRows[i]
				dr._hidePace()
			}
		}
		this.currentPaceMakerRow = null
		if(this.props.stopDrag) this.props.stopDrag()
	}

	_dragCancel = (gestureState, draggableRow) => {
		this._reset(draggableRow)
	}

	_dragDrop = (gestureState, draggableRow) => {
		let rows = this.state.rows
		let from = draggableRow.props.idx
		let to = rows.length - 1
		if (this.currentPaceMakerRow) {
			if (!this.isAcceptItem(this.currentPaceMakerRow, draggableRow)) {
				return false
			}
			to = this.currentPaceMakerRow.props.idx
			// console.log(`Move from ${from} to ${to}`)
			if (from < to) to -= 1
			// arrayMove(rows, from, to)
		} else {
			if (!this.isAcceptItem(null, draggableRow)) {
				return false
			}
		}

		rows = this.handleDrop(from, to)

		rows.forEach((row, idx, items) => {
			row.key = uuid.v4()
		})
		// console.log(rows)
		this.scrollDelta = 0
		this.setState({ rows: rows })
		if(this.props.stopDrag) this.props.stopDrag()
		
		// this._reset(draggableRow)
	}

	itemSize = (idx) => {
		return this.props.itemSizes[idx]
	}

	_dragMove = (gestureState, draggableRow) => {
		this._checkEdges(gestureState, draggableRow)
		let itemIdx = draggableRow.props.idx
		let start = draggableRow.screenPos
		let middle = start + (this.itemSize(itemIdx) / 2)

		let rowUnder = this.draggableRows.find((dr) => {
			if (dr === draggableRow) return false
			return dr.containsPosition(middle)
		})
		if (rowUnder) {
			let rowToMakePlace = null
			if (rowUnder.positionInUpper(middle)) {
				rowToMakePlace = rowUnder
			} else {
				let rmpIdx = rowUnder.props.idx + 1
				rowToMakePlace = rmpIdx < this.draggableRows.length ? this.draggableRows[rmpIdx] : null
				if (draggableRow === rowToMakePlace) {
					rmpIdx++
					rowToMakePlace = rmpIdx < this.draggableRows.length ? this.draggableRows[rmpIdx] : null
				}
			}
			if (this.currentPaceMakerRow === rowToMakePlace) {
				return
			}
			if (this.currentPaceMakerRow) {
				for (let i = this.currentPaceMakerRow.props.idx; i < this.draggableRows.length; i++) {
					let dr = this.draggableRows[i]
					if (draggableRow !== dr) {
						dr._hidePace()
					}
				}
			}

			this.currentPaceMakerRow = rowToMakePlace
			if (this.currentPaceMakerRow) {
				if (!this.isAcceptItem(this.currentPaceMakerRow, draggableRow)) return
				for (let i = this.currentPaceMakerRow.props.idx; i < this.draggableRows.length; i++) {
					let dr = this.draggableRows[i]
					if (draggableRow !== dr) {
						dr._makePace(draggableRow.size)
					}
				}
			}
		}
	}

	deleteRow = (row) => {
		let idx = row.props.idx
		LayoutAnimation.linear()
		let rows = this.state.rows
		if (this.props.deleteRow) {
			rows = this.props.deleteRow(idx)
		} else {
			rows.splice(idx, 1)
		}
		this.setState({ rows: rows })
	}

	handleDrop = (from, to) => {
		if (this.props.handleDrop) {
			return this.props.handleDrop(from, to)
		} else {
			return arrayMove(this.state.rows, from, to)
		}
	}

	isDraggable = (row) => {
		if (this.props.isDraggable) {
			return this.props.isDraggable(row.props.item)
		} else {
			return true
		}
	}

	isDeletable = (row) => {
		if (this.props.isDeletable) {
			return this.props.isDeletable(row.props.item)
		} else {
			return false
		}
	}

	isAcceptItem = (targetRow, draggedRow) => {
		if (this.props.isAcceptItem) {
			return this.props.isAcceptItem(targetRow ? targetRow.props.item : null, draggedRow.props.item)
		} else {
			return true
		}
	}

	_scrollBy = (dd, draggableRow) => {
		let nx = 0
		let ny = 0
		if (this.props.horizontal) {
			nx = this.scrollContentOffset.x + dd
		} else {
			ny = this.scrollContentOffset.y + dd
		}
		this.scrollDelta += dd
		this.list.scrollTo({ x: nx, y: ny, animated: false })
		draggableRow.scrollDelta = this.scrollDelta
	}

	_checkEdges = (gestureState, draggableRow) => {
		let screenStart = draggableRow.screenPos
		if (this.props.horizontal) {
			screenStart -= this.scrollContentOffset.x
		} else {
			screenStart -= this.scrollContentOffset.y
		}
		let screenEnd = screenStart + draggableRow.size
		if (this.props.horizontal) {
			if (screenEnd >= this.scrollLayout.width - 20) {
				if ((this.scrollLayout.width + this.scrollContentOffset.x) < this.contentSize.width) {
					this._scrollBy(SCROLL_BY, draggableRow)
				}
			} else if (screenStart < 20) {
				if (this.scrollContentOffset.x > 0) {
					this._scrollBy(-SCROLL_BY, draggableRow)
				}
			}
		} else {
			if (screenEnd >= this.scrollLayout.height - 20) {
				if ((this.scrollLayout.height + this.scrollContentOffset.y) < this.contentSize.height) {
					this._scrollBy(SCROLL_BY, draggableRow)
				}
			} else if (screenStart < 20) {
				if (this.scrollContentOffset.y > 0) {
					this._scrollBy(-SCROLL_BY, draggableRow)
				}
			}
		}
	}

	_onScroll = (event) => {
		// console.log('Scroll offset:',event.nativeEvent.contentOffset);
		this.scrollContentOffset = event.nativeEvent.contentOffset
	}

	_onScrollLayout = (event) => {
		// console.log('Scroll layout:',event.nativeEvent.layout)
		this.scrollLayout = event.nativeEvent.layout
	}

	_onContentSizeChange = (cntWidth, cntHeight) => {
		// console.log('Content size',cntWidth, cntHeight)
		this.contentSize = { width: cntWidth, height: cntHeight }
	}

	render() {
		let rows = this._renderRows()
		let contentSize = 0
		for (let i = 0; i < this.state.rows.length; i++) {
			contentSize += this.itemSize(i)
		}

		return (
			<ScrollView
				ref={(ref) => this.list = ref}
				scrollEnabled={this.state.scrollEnabled}
				style={this.props.style}
				scrollEventThrottle={256}
				onScroll={this._onScroll}
				onLayout={this._onScrollLayout}
				onContentSizeChange={this._onContentSizeChange}
				horizontal={this.props.horizontal}
			>
				<View style={
					{
						flex: 0,
						flexDirection: 'column',
						height: this.props.horizontal ? null : contentSize,
						width: this.props.horizontal ? contentSize : null,
					}}>
					{rows}
				</View>
			</ScrollView>
		)
	}
}

class RowContent extends Component {
	render() {
		return (
			<View style={
				{
					flex: 1,
					borderColor: 'gray',
					borderWidth: 1,
					borderRadius: 5,
					padding: 4,
					marginVertical: 2,
					flexDirection: 'row',
					justifyContent: 'center',
					alignItems: 'center'
				}}>
				<Text style={{ flex: 1 }}>{this.props.item.text}</Text>
				<Text>Y</Text>
			</View>
		)
	}
}

class DnDTestScreen extends Component {
	constructor(props) {
		super(props)
		this.rows1 = []
		this.rows2 = []
		size1 = []
		size2 = []
		for (let i = 0; i < ROW_COUNT; i++) {
			this.rows1.push({ height: 40 + (i * 3), key: i + 1, text: `${i + 1}`, draggable: true, accept: true })
			this.rows2.push({ height: 40 + (i * 3), key: i + 1, text: `${i + 1}`, draggable: true, accept: true })
		}
		size1 = this.rows1.map(row => row.height)//.push(40 + (i * 3))
		size2 = this.rows2.map(row => row.height)//.push(40 + (i * 3))
		this.state = {itemSizes1:size1, itemSizes2: size2}
	}
	isDraggable = (item) => {
		return item.draggable
	}

	isAcceptItem = (targetItem, draggedItem) => {
		return targetItem === null ? true : targetItem.accept
	}

	renderRow = (item) => {
		return <RowContent item={item} />
	}

	_switchEditable = () => {
		this.list1.editable = !this.list1.editable
		this.list2.editable = !this.list2.editable
	}

	handleDrop1 = (from, to) => {
		this.rows1 = arrayMove(this.rows1, from, to)
		let size1 = this.rows1.map(row => row.height)//.push(40 + (i * 3))
		this.setState({itemSizes1:size1})
		return this.rows1
	}

	handleDrop2 = (from, to) => {
		this.rows2 = arrayMove(this.rows2, from, to)
		let size2 = this.rows2.map(row => row.height)//.push(40 + (i * 3))
		this.setState({itemSizes2: size2})
		return this.rows2
	}

	deleteRow1 = (idx) => {
		this.rows1.splice(idx, 2)
		return this.rows1
	}

	deleteRow2 = (idx) => {
		this.rows2.splice(idx, 2)
		return this.rows2
	}

	_startDrag = () => {

	}

	_stopDrag = () => {
		
	}

	render() {
		return (
			<View
				style={{ flex: 1, marginTop: 25, flexDirection: 'column' }}
			>
				<DnDList
					style={
						{
							marginHorizontal: 10, height: 70,
							flex: 1, flexGrow: 1, flexShrink: 1
						}}
					ref={(ref) => this.list1 = ref}
					rows={this.rows1}
					itemSizes={this.state.itemSizes1}
					deleteRow={this.deleteRow1}
					renderRow={this.renderRow}
					isDraggable={this.isDraggable}
					isDeletable={this.isDraggable}
					isAcceptItem={this.isAcceptItem}
					handleDrop={this.handleDrop1}
					horizontal={!true}
					noDragHandle={!true}
					startDrag={this._startDrag}
					stopDrag={this._stopDrag}

				/>
				<DnDList
					style={
						{
							marginHorizontal: 10, height: 70,
							flex: 0, flexGrow: 0, flexShrink: 0
						}}
					ref={(ref) => this.list2 = ref}
					rows={this.rows2}
					itemSizes={this.state.itemSizes2}
					deleteRow={this.deleteRow2}
					renderRow={this.renderRow}
					isDraggable={this.isDraggable}
					isDeletable={this.isDraggable}
					isAcceptItem={this.isAcceptItem}
					handleDrop={this.handleDrop2}
					horizontal={true}
					noDragHandle={true}
					startDrag={this._startDrag}
					stopDrag={this._stopDrag}
				/>
				<TouchableOpacity
					style={{ flex: 0, margin: 10 }}
					onPress={this._switchEditable}
				>
					<Text>Switch</Text>
				</TouchableOpacity>
			</View>
		)
	}
}

export default DnDTestScreen
