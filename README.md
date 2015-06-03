Window Manager
==============

Window manager makes managing and communicating between multiple windows across the same application trivial. 
Utilizes localStorage for storage and communication and is therefore supported on all modern browsers and most non-modern ones as well. It provides an easy interface to message across windows and deal with their creation and destruction.

Has a number of useful features:

1. Communicating between windows on the same domain and namespace
2. Storing properties associated with windows
3. Opening, closing and focusing windows as well as remembering window properties
4. Master/sub relationship between windows
5. Supports multiple master windows on the same namespace
6. Makes popping up windows easier and also can ensure window uniqueness. 
Has special functionality to be able to focus a window even when not opened from the current page
7. Has helper functions to animate windows

Why Window Manager?
-------------------
Window manager was developed at Dataminr to enable us to communicate between our pages more efficiently as well as manage multiple pages within an application. It is used extensively at Dataminr on most of our products and is therefore quite stable and mature. 

Usage
-----

 # Example of initializing a _"parent"_ WindowManager instance 
 
 ````javascript
 var windowManager = new WindowManager({
	 name: "parentPage",
	 namespace: "windowManager01",
	 type: "master"
 });
 ````
 ### Example of initializing a _"sub"_ WindowManager instance
 
 ````javascript
 var windowManager = new WindowManager({
	 name: "subPage1",
	 namespace: "windowManager01",
	 parent: "parentPage",
 });
 ````

Website
-------

Visit the [website](http://dataminr.github.io/windowmanager) for more information

Development
-----------

### Tests and Coverage

To generate a test and coverage report:

```javascript
grunt test
```

### Documentation
To generate documentation from source code and create a gh-pages branch:

```javascript
grunt docs
```