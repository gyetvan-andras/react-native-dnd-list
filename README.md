# react-native-dnd-list

React Native DnD list sample implementation. I have developed it for my application and I am a bit lazy to create an npm module for it. And, to be honest, I think it doesn't deserve it.
However, if you do think it deserves a beer, you can send me you country's favorite. For postal details, drop me a comment :)

## Important Note 
This implementation is not for lists with lot of items. It is based on ScrollView and all item rendered in the same time, there is no optimization implemented for large list, infinite scrolling, etc.

## Usage

Look into ```DnDTestScreen.js``` -- everything is in this file.

You should extract the ```DnDList``` class as a standalone component. The usage in a nutshell:

```javascript
<DnDList
	ref={(ref) => this.list = ref}
	rows={this.rows}
	itemSizes={this.itemSizes}
	deleteRow={this.deleteRow}
	renderRow={this.renderRow}
	isDraggable={this.isDraggable}
	isDeletable={this.isDraggable}
	isAcceptItem={this.isAcceptItem}
	handleDrop={this.handleDrop}
	horizontal={!true}
	noDragHandle={!true}
	startDrag={this._startDrag}
	stopDrag={this._stopDrag}
/>
```
## Properties
- **rows**:  
array of items in the list. 
- **itemSizes**:  
array of item sizes (width when horizontal, height when vertical)
- **deleteRow**:  
callback function to delete a row. Parameter: item index. Returns the new item array (see ***rows***)
- **renderRow**:  
callback function to render a given item. Parameter: item. Returns the row component
- **isDraggabl**:  
callback function to decide if an item is draggable. Parameter: item. Returns true/false
- **isDeletable**:  
callback function to decide if an item is deletable. Parameter: item. Returns true/false
- **isAcceptItem**:  
callback function to decide if an item accepts another. Parameter: targetItem, draggedItem. Returns true/false
- **handleDrop**:  
callback function to handle the drop.
Parameters:from, to indexes. Returns the new item array (see ***rows***)
- **horizontal**:  
the list is horizontal or vertical. Default false
- **noDragHandle**:  
if true it will not draw a drag handle on list.edit true. Instead of the whole row can be draggable. Good for small items, for example horizontal image stripe.
- **startDrag**:  
callback function which is called when a drag starts
- **endDrag**:  
callback function which is called when a drag ends

## Instance Properties

- **editable**:  
boolean. Turns drag/delete handle

## In Action 
(click on the image to view the video)

<p align="center">
	<a href="https://www.youtube.com/watch?v=zENIPUrGgiA">
		<img src="https://img.youtube.com/vi/zENIPUrGgiA/0.jpg" alt="Image Editor">
	</a>
	<p align="center">
		Vertical/Horizontal DnD lists
	</p>
</p>

<p align="center">
	<a href="https://www.youtube.com/watch?v=2rGbX8WRS1o">
		<img src="https://img.youtube.com/vi/2rGbX8WRS1o/0.jpg" alt="Image Editor">
	</a>
	<p align="center">
		Nested DnD lists
	</p>
</p>


