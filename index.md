<div class="project-header">
    <div class="project-name">WindowManager</div>
    <div class="intro">
    	WindowManager makes managing managing and communication between browser windows easier.
 	</div>
</div>

## Source ##

Read the annotated source <a href="windowmanager.js.html" target="_blank">here</a>


<div class="clear"></div>
<div class="spacer"></div>

## Overview ##
The following are the core features of a WindowManager instance.
* Communicating between windows
* Opening, closing and focusing windows as well as remembering window properties
* Storing properties associated with windows
* Animating windows
* Lets you specify a "master" window that can control "sub" windows. A master window may contain other popup windows under it. These are automatically opened when the master windowManager is instantiated and their properties like width, height etc are retained from the last time the master window was closed.
* Can ensure window uniqueness by referencing a 'name' property of each WindowManager instance.    

<div class="clear"></div>

## Examples ##
<a href="examples/example1.md.html">Basic example</a><br>
<a href="examples/example2.md.html">Inter window messaging</a><br>
<a href="examples/example3.md.html">Animated Windows</a>

## API ##

| Type      |  Behavior  |
| ------------ | ------------------------------------------------------------------------------------------- |
| [send](#send) | sends a message by name to a given window |
| [on](#on) | subscribe to a message sent to the current window |
| [popupWindow](#popupWindow) | Opens a window with the given name and parameters like width, height, location etc |
| [closeWindow](#closeWindow) | Closes a window by name |
| [focusWindow](#focusWindow) | Focuses a window by name |
| [setProperty](#setProperty) |  sets a property of a window |
| [getProperty](#getProperty) | gets a property of a window |
| [deleteProperty](#deleteProperty) | deletes a property of a window |
| [setProperties](#setProperties) | sets all properties on a window |
| [getProperties](#getProperties) | gets all properties on a window |
| [getWindow](#getWindow) | get a window object by name |
| [getAllWindows](#getAllWindows) | gets an object containing all windows of a given parent |
| [getCurrentWindow](#getCurrentWindow) | gets an object containing all windows of a given parent |
| [setCurrentWindow](#setCurrentWindow) | set the current windows attributes like width, height, location etc of the current window in memory |
| [clearMemory](#clearMemory) | wipes the memory for the current namespace clean |

<a id="send"></a>
### send ###

Sends a message to a window. 

Takes a 'name' parameter of the message that is the then triggered on the receiving window.

```javascript
	// Can provide a 'name' parameter which is the name of the message to send
	// the 'to' parameter specifies who to send the message to
	windowManager.send({
		name: 'logout',
		to: 'dashboard'
	});
	// 'to' can also be an array of windowManager instance names
	windowManager.send({
		name: 'logout',
		to: ['dashboard', 'search']
	});
	// If the 'to' parameter is left out, the message is sent to all children 
	// within the current parent
	windowManager.send({
		name: 'logout'
	});
	// Can specify a different parent to target as well
	windowManager.send({
		name: 'logout'
		parent: 'myOtherApp'
	});
	// In order to send a message to an 'external' type window the 'parent' parameter must be 'external'
	windowManager.send({
		name: 'externalWindow'
		parent: 'external'
	});
```
<div class="clear"></div>

<a id="on"></a>
### on ###

Subscribe to a message sent to the current window. Takes a callback function that is passed an 'event object' along with additional arguments
passed to the 'send'

```javascript
	// Takes an event name and a callback function
   windowManager.on('logout', function(evt, additionalArg1, additionalArg2) {
        console.log(evt.from); // Name of the sender
        console.log(evt.to); // Name of the recipient
        console.log(evt.parent); // Name of the recipient parent
        console.log(evt.fromParent); // Name of the sender parent
    });
```


<a id="popupWindow"></a>
### popupWindow ###

Subscribe to a message sent to the current window. Takes a callback function that is passed an 'event object' along with additional arguments
passed to the 'send'

```javascript
	// Takes an window name and location
    windowManager.popupWindow({
		location: 'http://www.mydomain.com/myPage1',
		name: 'myPage1'
	});
	
	// Also takes additional window property parameters
    windowManager.popupWindow({
		location: 'http://www.mydomain.com/myPage1',
		name: 'myPage1',
		width: 300,
		height: 500,
		resizeable: 1,
		left: 100,
		top: 200
	});
	
	// setting focus to true will focus the window to the foreground if that window is already open
    windowManager.popupWindow({
		location: 'http://www.mydomain.com/myPage1',
		name: 'myPage1',
		focus: true
	});
```
<div class="clear"></div>

<a id="closeWindow"></a>
### closeWindow ###

Closes a currently open window by name.

**Note:** This method will only work for pages that are popups. This will not work on browser tabs.

```javascript
	// Closes a window by name
    windowManager.closeWindow('myPage1');

	// Can optionally specify a parent if not the current parent
	windowManager.closeWindow('myPage1', 'myOtherApp');
	
```
<div class="clear"></div>

<a id="focusWindow"></a>
### focusWindow ###

Brings a window that is already open to the foreground. 
Does this by either using a windows focus method if a reference to the window is available or reopening it if not.

Fires a focusedWindow event when done. Takes an options object with the following options.
* **name** {string} Name of the window to focus
* **parent** {string} (Optional) Parent of the window to focus.
* **windowName** {string} (Optional) Name of 'window' to restrict focus to
* **redirectUrl** {boolean} (Optional) Whether to redirect url if window is already open. Defaults to false.
* **reopenAllChildren** {boolean} (Optional) Whether to open all children of the window. Defaults to true.
* **noUserAction** {boolean} (Optional) If this is set to true, the window will always be opened using a new window. 
 This is due to a browser limitation that prevents focusing an already opened window if there is no user action in the call stack.
 Only needs to be specified if different from current instances parent.
 
**Note:** This method will only work for pages that are popups. This will not work on browser tabs.

```javascript
	// Focus a window by name
	windowManager.focusWindow({
		name: 'myPage1'
	});
```
<div class="clear"></div>

<a id="setProperty"></a>
### setProperty ###

Set a property of a window. These are persisted in memory

Defaults to the current window's properties unless otherwise specifying a name and/or a parent

```javascript
	// Set a windows property by key
	windowManager.setProperty('color', 'blue');
	
	// Set another windows properties on another parent
	windowManager.getProperty('color', 'blue', 'myOtherWindow', 'myOtherParent');
```
<div class="clear"></div>

<a id="getProperty"></a>
### getProperty ###

Get a persisted property of a window.

Defaults to the current window's properties unless otherwise specifying a name and/or a parent

```javascript
	// Get a windows property by key
	windowManager.getProperty('color');
	
	// Get another windows properties on another parent
	windowManager.getProperty('color', 'myOtherWindow', 'myOtherParent');
```
<div class="clear"></div>

<a id="deleteProperty"></a>
### deleteProperty ###

Delete a persisted property of a window.

Defaults to the current window's properties unless otherwise specifying a name and/or a parent

```javascript
	// Get a windows property by key
	windowManager.deleteProperty('color');
	
	// Get another windows properties on another parent
	windowManager.deleteProperty('color', 'myOtherWindow', 'myOtherParent');
```

<div class="clear"></div>

<a id="setProperties"></a>
### setProperties ###

Set all properties of a window. These are persisted in memory.

```javascript
	// Set a windows properties as an object
	windowManager.setProperties({
		color: 'blue',
		count: 1
	});
	
	// Set another windows properties as an object
	windowManager.setProperties({
		color: 'blue',
		count: 1
	}, 'myOtherWindow', 'myOtherParent');
```

<div class="clear"></div>

<a id="getProperties"></a>
### getProperties ###

Get all properties of a window.

```javascript
	// Get a windows properties as an object
	windowManager.getProperties();
	
	// Set another windows properties as an object
	windowManager.getProperties('myOtherWindow', 'myOtherParent');
```

<div class="clear"></div>

<a id="getWindow"></a>
### getWindow ###

Get the object representation of a window.

```javascript
	// Get a window as an object
	windowManager.getWindow('myOtherWindow');
	
	// Get a window on another parent as an object
	windowManager.getWindow('myOtherWindow', 'myOtherParent');
```

<div class="clear"></div>

<a id="getAllWindows"></a>
### getAllWindows ###

Get an object representation for all windows in a given parent

```javascript
	// Get all windows in current parent
	windowManager.getAllWindows();
	
	// Get all windows in another parent
	windowManager.getAllWindows('myOtherParent');
```

<div class="clear"></div>

<a id="getCurrentWindow"></a>
### getCurrentWindow ###

Get the object representation of the current window

```javascript
	// Get the current window
	windowManager.getCurrentWindow();
```

<div class="clear"></div>

<a id="setCurrentWindow"></a>
### setCurrentWindow ###

Set the windows attributes like width, height, location etc of the current window in memory

```javascript
	// Set the current Window
	windowManager.setCurrentWindow();
```

<div class="clear"></div>

<a id="clearMemory"></a>
### clearMemory ###

Clears the memory for a given 'namespace'

```javascript
	// Set the current Window
	windowManager.clearMemory();
```

<div class="clear"></div>


## Usage ##

There are 3 different types of WindowManager instances

**Note:** Only windows in the same localStorage 'namespace' are capable of interacting with each other


#### master ####
<div class="left">
The main window associated with a set of windows.
<ul>
<li>When it opens, all "sub" windows associated with it are opened automatically.</li>
<li>A given 'namespace' in localStorage can have multiple "master" windows.</li>
<li>A master window can have multiple "sub" windows.</li>
</ul>
</div>

 ````javascript
 // Example of initializing a 'master' WindowManager instance
 new WindowManager({
 	// The name of the window used as its id
	 name: 'parentPage',
	 // The type of the window
	 type: 'master'
	  // The key used in localStorage
	 namespace: 'windowManager01',
 });
 ````
 
<div class="clear"></div>

#### sub ####
<div class="left">
These are windows associated with a "master" window as their parent.
<ul>
<li>They are opened automatically when their parent is opened.</li>
<li>Their properties like width and height are persisted in memory and are reused when their are opened.</li>
</ul>
</div>

 ````javascript
 // Example of initializing a 'sub' WindowManager instance
 new WindowManager({
 	// The name of the window used as its id
	 name: 'subPage1',
	// The name of its parent "master" window
	 parent: 'parentPage',
	 // The namespace key used in localStorage
	 // Should match its parents key
	 namespace: 'windowManager01',
 });
 ````
<div class="clear"></div>

#### external ####

<div class="left">
These are windows that are external to any "master" window.
<ul>
<li>Not associated with a parent "master" window</li>
<li>Not persisted in memory</li>
<li>Capable of communicating with all other windows in the same namespace</li>
</ul>
</div>
 
 ````javascript
 // Example of initializing an 'external' WindowManager instance
 new WindowManager({
 	// The name of the window used as its id
	 name: 'externalPopup',
	 // The type of the window 'external'
	 type: 'external',
	 // The namespace key used in localStorage
	 namespace: 'windowManager01'
 });
 ````
<div class="clear"></div>
