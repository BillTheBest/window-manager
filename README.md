Window Manager
==============

Window manager makes managing and communicating between multiple windows across the same application trivial. 
Utilizes localStorage for storage and communication and is therefore supported on all modern browsers and most non-modern ones as well. It provides an easy interface to message across windows and deal with their creation and destruction.

The following are the core features of a WindowManager instance.
* Communicating between windows
* Opening, closing and focusing windows as well as remembering window properties
* Storing properties associated with windows
* Animating windows
* Lets you specify a "master" window that can control "sub" windows. A master window may contain other popup windows under it. These are automatically opened when the master windowManager is instantiated and their properties like width, height etc are retained from the last time the master window was closed.
* Can ensure window uniqueness by referencing a 'name' property of each WindowManager instance.    


Why Window Manager?
-------------------
Window manager was developed at Dataminr to enable us to communicate between our pages more efficiently as well as manage multiple pages within an application. It is used extensively at Dataminr on most of our products and is therefore quite stable and mature. 

Website
-------

Visit the [website](http://dataminr.github.io/window-manager) for detailed API docs and examples


Development
-----------

### Tests and Coverage

To run tests in the browser, run the following command in the root directory:

```javascript
grunt test
```

### Documentation
To generate documentation from source code and create a gh-pages branch:

```javascript
grunt docs
```