# react-native-dnd-list

React Native DnD list sample implementation. It developed for my application and I am a bit lazy to create an npm module for it.

## Usage

Look into ```DnDTestScreen.js``` -- everything is in this file.

You should extract the ```DnDList``` class as a standalone component. The usage in a nutshell:

```javascript
<DnDList
	style={
		{
			marginHorizontal: 10, height: 70,
			flex: 1, flexGrow: 1, flexShrink: 1
		}}
	ref={(ref) => this.list1 = ref}
	rows={this.rows1}
	itemSize={this.itemSize1}
	deleteRow={this.deleteRow1}
	renderRow={this.renderRow}
	isDraggable={this.isDraggable}
	isDeletable={this.isDraggable}
	isAcceptItem={this.isAcceptItem}
	handleDrop={this.handleDrop1}
	horizontal={!true}
	noDragHandle={!true}
/>
```

- **rows**:  
aa
- **itemSize**:  
aa
- **deleteRow**:  
aa
- **renderRow**:  
aa
- **isDraggabl**:  
aa
- **isDeletable**:  
aa
- **isAcceptItem**:  
aa
- **handleDrop**:  
aa
- **horizontal**:  
the list is horizontal or vertical. Default false
- **noDragHandle**:  
if true it will not draw a drag handle on list.edit true. Instead of the whole row can be draggable. Good for small items, for example horizontal image stripe.


