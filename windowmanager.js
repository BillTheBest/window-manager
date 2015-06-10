/*
* @version 0.0.2
*
* @fileOverview Helps manage windows in the browser.
*
* Has a number of useful window functions including -
* 1) Communicating between windows on the same domain and 'namespace'
* 2) Storing properties associated with windows
* 3) Opening, closing and focusing windows as well as remembering window properties
* 4) Animating windows
*
* Extremely useful for browser applications dealing with several different pages at the same
* time. Simplifies communication and management.
*
* Lets you specify a 'master' window that can control 'sub' windows.
* A master window may contain other popup windows under it. These are automatically opened
* when the master windowManager is instantiated and their properties like width, height etc
* are retained from the last time the master window was closed.
*
* Can also make sure of window uniqueness by referencing a 'name' property of each WindowManager
* instance.
*
*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([
            'jquery',
            'backbone-events-standalone',
            'lodash/object/extend',
            'lodash/function/delay',
            'lodash/lang/isObject',
            'lodash/collection/each',
            'lodash/lang/cloneDeep',
            'lodash/function/bind',
            'lodash/math/min',
            'lodash/math/max',
            'lodash/lang/toArray',
            'lodash/array/without',
            'lodash/object/keys',
            'lodash/lang/isEqual',
            'lodash/function/debounce',
            'lodash/collection/reduce'
        ], function (
                $,
                events,
                extend,
                delay,
                isObject,
                each,
                cloneDeep,
                bind,
                min,
                max,
                toArray,
                without,
                keys,
                isEqual,
                debounce,
                reduce
            ) {
            return (root.WindowManager = factory(
                $,
                events,
                extend,
                delay,
                isObject,
                each,
                cloneDeep,
                bind,
                min,
                max,
                toArray,
                without,
                keys,
                isEqual,
                debounce,
                reduce
            ));
        });
    } else {
//        Browser globals
        var $ = root.$,
            events = root.BackboneEvents,
            extend = root._.extend,
            delay = root._.delay,
            isObject = root._.isObject,
            each = root._.each,
            cloneDeep = root._.cloneDeep,
            bind = root._.bind,
            min = root._.min,
            max = root._.max,
            toArray = root._.toArray,
            without  = root._.without,
            keys = root._.keys,
            isEqual = root._.isEqual,
            debounce = root._.debounce,
            reduce = root._.reduce;

        root.WindowManager = factory(
            $,
            events,
            extend,
            delay,
            isObject,
            each,
            cloneDeep,
            bind,
            min,
            max,
            toArray,
            without,
            keys,
            isEqual,
            debounce,
            reduce
        );
    }
}(this, function ($, events, extend, delay, isObject, each, cloneDeep, bind, _min, _max, toArray, _without, _keys, _isEqual, _debounce, _reduce) {

    /*
     ## INTERNAL HELPERS
     */
    /**
     * Is the given window a popup window.
     * Not 100% reliable -- must be called while
     * the opener is still open aka immediately
     * after popup is opened
     * @param win
     * @returns {boolean}
     */
    var isPopupWindow = function(win) {
        if(!win) return;
        var bool = false;
        try {
            bool = Boolean(win.opener);
        } catch(e) {}
        return bool;
    };
    /**
     * Is the browser environment macintosh
     * @returns {boolean}
     */
    var isMac = function () {
        return (navigator.userAgent.indexOf('Mac OS X') != -1);
    };
    /**
     * Is the browser less than IE9
     * @returns {number}
     */
    var isOldIE = function () {
        var undef,
            v = 3,
            div = document.createElement('div'),
            all = div.getElementsByTagName('i');
        while (
            div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
                all[0]
            );
        return v > 4 ? v : undef;
    };
    var isPageHidden = function() {
        // Set the name of the hidden property and the change event for visibility
        var hidden;
        if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
            hidden = "hidden";
        } else if (typeof document.mozHidden !== "undefined") {
            hidden = "mozHidden";
        } else if (typeof document.msHidden !== "undefined") {
            hidden = "msHidden";
        } else if (typeof document.webkitHidden !== "undefined") {
            hidden = "webkitHidden";
        }
        return Boolean(document[hidden]);
    };
    /**
     * Is the browser Chrome
     * @returns {boolean}
     */
    var isChrome = function() {
        return /Chrome/.test(navigator.userAgent)
    };
    /**
     * Is the browser Firefox
     * @returns {boolean}
     */
    var isFirefox = function() {
        return (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
    };
    /**
     *
     * @type {{wmKey: string, msgTimeout: number, hasNativeWindowFocus: hasNativeWindowFocus, isMac: boolean, hasSelfTriggerError: number, hasDoubleUnloadBug: boolean, isValidWindow: isValidWindow, getUniqueWindowName: getUniqueWindowName}}
     */
    var Config = {
        wmKey: "__windowManager",
        msgTimeout: 60000,
        popupDelay: 2000,
        defaultPopupHeight: 200,
        defaultPopupWidth: 200,
        macChromeHeight: 52,
        winChromeHeight: 75,
        macMinWindowHeight:122,
        winMinWindowHeight: 75,
        macMinWindowWidth: 310,
        winMinWindowWidth: 158,
        hasNativeWindowFocus: function() {
            return true;
        },
        isMac: isMac(),
        isChrome: isChrome(),
        hasSelfTriggerError: isOldIE(),
        // Don't need this anymore because of delay before adding unload.
        // Otherwise when you open a popup the page causes an unload event when redirecting
        // the page to the url provided for the popup on some browsers.
        hasDoubleUnloadBug: false,
        isValidWindow: function(win) {
            var valid = false;
            try {
                valid = win != null && win.outerHeight && win.innerHeight && !isPageHidden();
            } catch(e) {
            }
            return valid;
        },
        getUniqueWindowName: function(name, parent) {
            return name + ':' + parent;
        },
        isPopupWindow: isPopupWindow(),
        /*
         Get window dimensions adjusted for window chrome on some
         environments.
         At the moment this is only present on chrome for windows
         */
        getAdjustedWindowDimensions: function(obj) {
            var retObj = {
                width: obj.width,
                height: obj.height
            };
            // Do adjustments only for non-mac chrome
            if(!Config.isChrome || Config.isMac || !window.outerWidth || !window.innerWidth) return retObj;
            var heightDiff = (Config.isPopupWindow) ? (window.outerHeight - window.innerHeight) / 2 : (window.outerHeight - window.innerHeight) / 2.9;
            var widthDiff = (window.outerWidth - window.innerWidth);
            if(obj.width != null) {
                retObj.width = obj.width - widthDiff;
            }
            if(obj.height != null) {
                retObj.height = obj.height - heightDiff;
            }
            return retObj;
        }
    };

    /*
     ## INITIALIZATION
     */
    /*
     #### Example of initializing a _'parent'_ WindowManager instance
     ````javascript
     new WindowManager({
         name: 'parentPage',
         namespace: 'windowManager01',
         type: 'master'
     });
     ````
     #### Example of initializing a _'sub'_ WindowManager instance
     ````javascript
     new WindowManager({
         name: 'subPage1',
         namespace: 'windowManager01',
         parent: 'parentPage',
     });
     ````
     #### Example of initializing an _'external'_ WindowManager instance
     ````javascript
     new WindowManager({
     name: 'externalPopup',
     type: 'external',
     namespace: 'windowManager01'
     });
     ````
     */
    /**
     * @param options
     * @param options.name {string} Name to register current window as
     * @param options.namespace {string} The namespace to use in localStorage
     * @param options.parent {string} The 'name' of the parent window. Not required if _type_ is _'master'_.
     * @param options.type {string} Can be either _'master'_, _'sub'_ or _'external'_
     * @param options.suppressMessageCheck {boolean} Whether to *not* check messages on initial page load.
     * Useful when window manager is instantiated before we want any of the attached events handlers to execute.
     * @returns {*}
     * @constructor
     */
    var WindowManager = function(options) {
        var _this = this;
        // Error check
        if(window[Config.wmKey]) return console.error('Window Manager already exists on window with namespace', window[Config.wmKey].namespace);
        // Add instance to window
        window[Config.wmKey] = this;
        // Namespace for data in localStorage
        this.namespace = options.namespace;
        // Extend the config
        if(options.config) extend(Config, options.config);
        // Expose the valid window check
        this.isValidWindow = Config.isValidWindow;
        // Map to hold window references
        this.windowRefs = {};
        // Map to hold temporary value for windows being opened
        this.beingOpened = {};
        // Error check
        if(!(typeof options.name=="string") || !(typeof this.namespace=="string")) console.error('Invalid options for WindowManager');
        // Register the window
        this._registerWindow({
            name: options.name,
            type: options.type,
            parent: options.parent
        });
        // Setup all listeners
        this._setupEventBindings();
        // Special handling for a master window on init
        if(_this.type == "master") {
            delay(function(){
                _this.refreshCache();
                _this._clearOldMessages();
                _this.clearAllMessagesForParent(_this.parent);
                var currentCachedWindow = _this._getCurrentCachedWindow();
                var silentReopen = currentCachedWindow.silentReopen;
                if(!silentReopen) _this.openAllChildren();
                delete currentCachedWindow.silentReopen;
                _this.updateMemory();
            }, 100);
        }
        if(!options.suppressMessageCheck) this._checkMessages();
    };

    // Add events system
    extend(WindowManager.prototype, events);
    // Declare prototype for convenience
    var wm = WindowManager.prototype;

    /*
     ## PUBLIC FUNCTIONS
     */
    /**
     *
     * #### send
     * Function to send messages across windows.
     * Any additional arguments are passed on to as the second arguments of the message callback
     * @param obj
     * @param obj.name {string} Name of the message
     * @param obj.to {string|string[]} Recipient(s) of the message
     * @param obj.parent {string} _Parent_ of the recipient(s) of the message
     * @returns {*}
     */
    wm.send = function send(obj) {
        if(!isObject(obj) || !obj.name) return console.error('Invalid arguments to send');
        this.refreshCache();
        this._addCachedMessage.apply(this, toArray(arguments));
        this.updateMemory();
    };

    /**
     * #### popupWindow
     * Open a window by name
     * Has the ability to force a window to focus
     *
     * Will open the window with the properties passed in such as width, height, left, top etc.
     * Defaults to the saved properties of the window with the same 'name' as provided.
     *
     * @param options
     * @param options.name {string} Name of the WindowManager instance
     * that exists on the page with the same 'location' as provided
     * @param options.focus {boolean} Whether or not to focus the window if already open
     * @param forceToForeground {boolean} Whether to force the window
     * into focus
     * @returns {*}
     */
    /*
     ##### Example usage of popupWindow
     ```javascript
     app.windowManager.popupWindow({
         location: path,
         name: 'notificationPopup',
         width: 320,
         height: 1,
         resizeable: 1,
         left:left,
         top:top,
         focus: true
     });
     ```
     */
    wm.popupWindow = function(options, forceToForeground) {
        var _this = this;
        var popupCallback = options.callback;
        var focus = forceToForeground || options.focus;
        var retWin;
        this.trigger('poppingUpWindow');
        this.refreshCache();
        var cachedWin = _this._getCachedWindow({
            name: options.name,
            parent: options.parent
        });
        var win = extend({}, cachedWin, options);
        if(cachedWin && cachedWin.isOpen && focus) {
            retWin = this.focusWindow(win, popupCallback);
        } else {
            retWin = this.openWindow(win);
            if(popupCallback) popupCallback(retWin, win);
        }
        return retWin;
    };
    /**
     * #### focusWindow
     * Function to bring a window that is already open
     * to the foreground. Does this by either using a
     * windows focus method if a reference to the
     * window is available or reopening it if not.
     *
     * Fires a focusedWindow event when done.
     *
     * @param options
     * @param options.name {string} Name of the window to focus
     * @param options.parent {string} (Optional) Parent of the window to focus.
     * @param options.windowName {string} (Optional) Name of 'window' to restrict focus to
     * @param options.redirectUrl {boolean} (Optional) Whether to redirect url if window is already open. Defaults to false.
     * @param options.reopenAllChildren {boolean} (Optional) Whether to open all children of the window. Defaults to true.
     * @param options.noUserAction {boolean} (Optional) If this is set to true, the window will always be opened using a new
     * window. This is due to a browser limitation that prevents focusing an already opened window if there is no user action
     * in the call stack.
     * Only needs to be specified if different from current instances parent.
     * @param callback
     * @returns {*}
     */
    wm.focusWindow = function(options, callback) {
        var _this = this;
        options = options || {};
        var name = options.name;
        var parent = options.parent || this.parent;
        var windowName = options.windowName;
        var reopenAllChildren = options.reopenAllChildren; // Option to relaunch all children on focus
        var userActionMissing = options.noUserAction; // Signal whether a user action is missing in the call stack

        // If this is the target window itself, make it reopen itself
        if(this.name == name && this.parent == parent) {
            this.makeWindowOpenSilent();
            this.makeWindowCloseSilent();
            options.forceNew = true;
            var win = this.openWindow(options);
            if(callback) callback(win, options);
            window.close();
            return win;
        }
        var cachedWindow = this._getCachedWindow(name, parent);

        // If the window is not open return;
        if(!cachedWindow || !cachedWindow.isOpen) return;

        // If the window is being opened return;
        if(this.beingOpened[parent + '-' + name]) return;

        // If we have access to the current window in our array of window refs just focus it
        var focusedWin;
        var windowRefObj = this._getWindowRefObj(windowName || name, parent);
        if(windowRefObj) focusedWin = windowRefObj.popup;
        if(focusedWin && Config.hasNativeWindowFocus() && Config.isValidWindow(focusedWin) && !userActionMissing) {
            focusedWin.focus();
            this.notify('focusedWindow');
            try {
                // Set the location of the window to the new location if they are different
                if(options.redirectUrl && options.location && (focusedWin.location.href != options.location)) {
                    _this._unsetPopupUnloadHandler(windowName, parent);
                    focusedWin.location = options.location;
                    _this._setPopupUnloadHandler(windowName, parent, focusedWin);
                }
            } catch(e) {
            }
            if(callback) callback(focusedWin, options);
            return focusedWin;
        } else {
            // Otherwise ping the window to see if it responds
            var pingWindowCallback = bind(function(res) {
                // If the window response,
                // send it a message telling it to close itself.
                if(res) {
                    this.send({
                        name: 'closeWindow',
                        to: name,
                        parent: parent
                    }, {
                        silent: !reopenAllChildren
                    });
                    if(!reopenAllChildren) this.makeWindowOpenSilent(name, parent);
                    delay(function() {
                        var win = _this.openWindow({
                            name: name,
                            parent: parent,
                            location: options.location
                        });
                        if(callback) callback(win);
                    }, 200);

                    // Otherwise just open it
                } else {
                    _this.openWindow(options);
                }
            }, this);
            this.pingWindow({ name: name, parent: parent }, pingWindowCallback);
        }
    };
    /**
     * #### openWindow
     *
     * This is a largely internal method for opening
     * windows. As opposed to popupWindow it does not
     * support refocusing already opened windows.
     *
     * Will override the window properties with properties
     * passed in but will default to saved properties of the
     * window saved in cache by the same 'name'.
     * Also stores a reference to the window for use by the
     * window manager.
     *
     * Takes a forceNew option that will make sure of a unique
     * windowName for a window to make sure the page is not
     * opened on a window that already exists.
     *
     * Fires a poppedUpWindow pr popupBlocked event when done.
     *
     * @param options
     * @returns {Window}
     */
    /*
     ##### Example usage of openWindow
     ```javascript
     var win = _this.openWindow({
     name: 'name',
     parent: 'parent'
     });
     ```
     */
    wm.openWindow = function(options) {
        var _this = this;
        var name = options.name;
        var parent = options.parent || this.parent;
        var cachedWin = _this._getCachedWindow({
            name: name,
            parent: parent
        });
        var win = extend({}, cachedWin, options);
        var windowName = encodeURI(win.windowName || name);
        if(!win.location) return console.error("openWindow needs a location");
        // Option to force opening a new window in case passed in name is same as a windowName that already exists
        if(options.forceNew) windowName  = windowName + new Date().getTime();
        var adjustedDimensions = Config.getAdjustedWindowDimensions({
            width: win.width,
            height: win.height
        });
        var winAttrObj = {
            width: adjustedDimensions.width || Config.defaultPopupHeight,
            height: adjustedDimensions.height || Config.defaultPopupWidth,
            resizable: win.resizable,
            left: win.left,
            top: win.top
        };
        var windowAttrs = _reduce(winAttrObj, function(result, val, key) {
            if(val == null) return result;
            if(result !== '') result += ',';
            result += key + '=' + val;
            return result;
        }, '');
        var popup = window.open(win.location, windowName, windowAttrs);
        // If a window already exists with the same location and windowName focus it
        if(popup && popup.focus) popup.focus();
        // Set the the window being opened to true
        this.beingOpened[parent + '-' + name] = true;
        /*
         Defer because of a bug in browsers where return window object is not populated immediately
         */
        delay(function() {
            // Set the the window being opened to false
            delete _this.beingOpened[parent + '-' + name];
            // If the window is not valid notify
            if(!popup || !Config.isValidWindow(popup)) {
                _this.notify('popupBlocked', win);
            // Otherwise store the reference and notify
            } else {
                _this.notify('poppedUpWindow', win);
                var windowRefObj = _this._addWindowRefObj(windowName || name, options.parent, popup);
                 // Clear the window reference on unload
                _this._setPopupUnloadHandler(windowName, options.parent, popup);
            }
        }, Config.popupDelay);
        return popup;
    };
    /**
     * #### closeWindow
     * Close a window by name and optional parent
     * Defaults to this parent
     * @param name
     * @param parent
     */
    wm.closeWindow = function(name, parent) {
        var obj = (isObject(name)) ? name : { name: name, parent: parent || this.parent };
        this.send({
            name: "closeWindow",
            to: obj.name,
            parent: obj.parent
        });
    };

    /**
     * #### getProperty
     * Get a property of a window. These are persisted in memory.
     * @param key Key to get
     * @param name Name of the window
     * @returns {*}
     */
    wm.getProperty = function(key, name, parent) {
        var cachedObj = this._getCachedWindow(name || this.name, parent);
        return (cachedObj && cachedObj.props) ? cachedObj.props[key] : undefined;
    };
    /**
     * #### getProperties
     * Get all properties of a window. These are persisted in memory.
     * @param name Name of the window
     * @param parent Name of parent the window
     * @returns {*}
     */
    wm.getProperties = function(name, parent) {
        var cachedObj = this._getCachedWindow(name || this.name, parent);
        return (cachedObj) ? cachedObj.props : undefined;
    };
    /**
     * #### setProperty
     * Set a property of a window. These are persisted in memory.
     * @param key Key to set
     * @param val Value to set
     * @param name Name of the window
     * @param parent Name of the parent window
     */
    wm.setProperty = function(key, val, name, parent) {
        this.refreshCache();
        var cachedObj = this._getCachedWindow(name || this.name, parent);
        if(cachedObj && cachedObj.props) {
            cachedObj.props[key] = val;
        }
        this.updateMemory();
    };
    /**
     * #### deleteProperty
     * Delete a persisted property of a window
     * @param key Key to set
     * @param name Name of the window
     * @param parent Name of the parent window
     */
    wm.deleteProperty = function(key, name, parent) {
        this.refreshCache();
        var cachedObj = this._getCachedWindow(name || this.name, parent);
        if(cachedObj && cachedObj.props) {
            delete cachedObj.props[key];
        }
        this.updateMemory();
    };
    /**
     * #### setProperties
     * Set all properties of a window. These are persisted in memory.
     * @param val Value to set
     * @param name Name of the window
     * @param parent Name of the parent window
     */
    wm.setProperties = function(val, name, parent) {
        this.refreshCache();
        var cachedObj = this._getCachedWindow(name || this.name, parent);
        if(cachedObj) {
            cachedObj.props = val;
        }
        this.updateMemory();
    };
    /**
     * #### getAllWindows
     * Get an object representation for all windows in a given parent
     * @param parent Name of parent
     * @returns {*}
     */
    wm.getAllWindows = function(parent) {
        this.refreshCache();
        return cloneDeep(this._getCachedWindowParent(parent));
    };
    /**
     * #### getWindow
     * Get the object representation of a window
     * @param name Name of window
     * @param parent Name of parent
     * @returns {*}
     */
    wm.getWindow = function(name, parent) {
        this.refreshCache();
        return cloneDeep(this._getCachedWindow(name, parent));
    };
    /**
     * #### getCurrentWindow
     * Get the object representation of the current window
     * @returns {*}
     */
    wm.getCurrentWindow = function() {
        this.refreshCache();
        return cloneDeep(this._getCurrentCachedWindow());
    };
    /**
     * #### clearMemory
     * Clear the memory
     */
    wm.clearMemory = function() {
        localStorage.removeItem(this.namespace);
    };
    /**
     * #### clearMessagesForParent
     * Clear messages for a parent
     * @param parent
     */
    wm.clearAllMessagesForParent = function(parent) {
        this.refreshCache();
        this._clearCachedMessages(parent);
        this.updateMemory();
    };
    /**
     * #### checkMessages
     */
    wm.checkMessages = function() {
        //Force the window to check current message queue
        this._checkMessages(this.name);
    };
    /**
     * #### updateMemory
     * Update the memory
     */
    wm.updateMemory = function() {
        this._updateCachedUID();
        localStorage.setItem(this.namespace, JSON.stringify(this.cached));
        // Need to use a setBit to cause localStorage updates on some browsers
        // Because some browsers don't recognize changes if the string is too long
        localStorage.setItem(this.namespace + 'setBit', new Date().getTime().toString());
    };
    /**
     * #### refreshCache
     * Refresh the cached object from memory
     */
    wm.refreshCache = function() {
        var cachedDefault  = {
            windows : {},
            msgs: {},
            uid: 0
        };
        var currentCacheString = localStorage.getItem(this.namespace) ;
        var currentCache;
        try{
            currentCache = JSON.parse(currentCacheString);
        } catch(e) {
            console.log(e, e.toString());
        }
        this.cached = (!currentCache) ? cachedDefault : extend(cachedDefault, currentCache);
    };
    /**
     * Send a ping to see if a window responds
     * @param obj
     * @param cb
     */
    wm.pingWindow = function(obj, cb) {
        var _this = this;
        this.pingDfd = $.Deferred();
        this.send({
            name: 'pingWindowRequest',
            to:  obj.name,
            parent: obj.parent
        });
        this.pingDfd.done(function(flag) {
            cb(flag);
        });
        delay(function() {
            _this.pingDfd.resolveWith(null, [false]);
        }, 1000);
    };
    /**
     * #### makeWindowCloseSilent
     * Calling this function will not delete it from memory
     * on the next close
     */
    wm.makeWindowCloseSilent = function() {
        this.closeSilent = true;
    };
    /**
     * #### makeWindowOpenSilent
     * @param name
     * @param parent
     */
    wm.makeWindowOpenSilent = function(name, parent) {
        if(!Config.hasSelfTriggerError) {
            this.refreshCache();
            var cachedWin = this._getCachedWindow({
                name: name || this.name,
                parent: parent || this.parent
            });
            if(cachedWin.type && !cachedWin.type == "master") return;
            cachedWin.silentReopen = true;
            this.updateMemory();
        }
    };
    /**
     * #### setCurrentWindow
     * Sets the properties of the current window in memory
     */
    wm.setCurrentWindow = function() {
        this.refreshCache();
        this._registerWindow({
            name: this.name,
            parent: this.parent,
            type: this.type
        }, true);
        this.updateMemory();
    };
    /**
     * #### notify
     * Trigger an event on the current instance
     * @param name Name of the event
     * @param arg1 Additional argument to passed along
     * @param arg2 Additional argument to passed along
     */
    wm.notify = function(name, arg1, arg2) {
        this.trigger.apply(this, [name].concat(Array.prototype.slice.call(arguments,1)));
    };

    /*
     ### Position and Animation
     */
    /**
     * #### animateWindow
     * animateWindow takes a window instance, some options and a callback and animates the given window to the
     * height and width provided
     *
     * win {window} window to be animated
     * options {object}
     * options.innerHeight innerHeight to animate the window to
     * options.innerWidth innerWidth to animate the window to
     * options.anchorBottom
     * options.anchorRight
     *
     * @type {*}
     */
    wm.animateWindow = (function() {
        var isAnimating,
            maxHeight,
            maxWidth,
            chromeHeight = (Config.isMac) ? Config.macChromeHeight : Config.winChromeHeight,
            minHeight = (Config.isMac) ? Config.macMinWindowHeight : Config.winMinWindowHeight,
            minWidth = (Config.isMac) ? Config.macMinWindowWidth : Config.winMinWindowWidth;
        return function(win, options, callback) {
            if(isAnimating) return;
            isAnimating = true;
            options = options || {};
            // Can pass an innerHeight which is the target height of the document within the window. wm will calculate what the actual height should be
            var passedHeight = (options.innerHeight) ? chromeHeight + options.innerHeight : options.height;
            // Target height for the window
            maxHeight = (typeof passedHeight != "undefined") ? passedHeight : 153;
            // Make sure the target height is at least the minimum allowed by the browser
            maxHeight = _max([minHeight, maxHeight]);
            maxWidth = (typeof options.width != "undefined") ? options.width : 310;
            maxWidth = _max([minWidth, maxWidth]);
            // Positive for increase, negative for decrease
            var yDir = maxHeight >= win.outerHeight ? 1 : -1,
            // Positive for increase, negative for decrease
                xDir = maxWidth >= win.outerWidth ? 1 : -1,
                xConstraint = options.xConstraint || screen.availWidth,
                yConstraint = options.yConstraint || screen.availHeight,
                anchorBottom = options.anchorBottom,
                anchorRight = options.anchorRight,
                left,
                top,
            // Minimum increment
                minInc = options.increment || 1;
            var animateWin = function() {
                var winHeight = win.outerHeight,
                    winWidth = win.outerWidth;

                //Calculate the new window dimensions for this cycle
                var incHeight = (win.outerHeight - maxHeight != 0) ? Math.max(Math.abs(win.outerHeight - maxHeight) / 2, minInc) : 0;
                winHeight+= yDir * incHeight;
                var incWidth = (win.outerWidth - maxWidth != 0) ? Math.max(Math.abs(win.outerWidth - maxWidth) / 2, minInc) : 0;
                winWidth+= xDir * incWidth;
                var yMax = (yDir > 0) ? _min : _max;
                var yLimit = (yDir > 0) ? maxHeight: minHeight;
                winHeight = yMax([winHeight, yLimit]);
                var xMax = (xDir > 0) ? _min : _max;
                var xLimit = (xDir > 0) ? maxWidth: minWidth;
                winWidth = xMax([winWidth, xLimit]);

                //Calculate the new window positions for this cycle
                top = (options.top != null) ? options.top : win.screenY;
                if(anchorBottom) top = anchorBottom - winHeight;
                if((top + winHeight) > yConstraint) top = yConstraint - winHeight;
                left = (options.left != null) ? options.left : win.screenX;
                if(anchorRight) left = anchorRight - winWidth;
                if((left + winWidth) > xConstraint) left = xConstraint - winWidth;

                win.moveTo(left, top);
                win.resizeTo(winWidth, winHeight);

                //Calculate whether or not to run another cycle
                if(winHeight != maxHeight || winWidth != maxWidth) {
                    animateWin();
                } else {
                    isAnimating = false;
                    if(callback) callback();
                }
            };
            animateWin();
        }
    })();
    /**
     * #### moveWindowBy
     * Move a window by an x and y value
     * @param win
     * @param xDiff
     * @param yDiff
     */
    wm.moveWindowBy = function(win, xDiff, yDiff) {
        if(!win) return;
        var rightEdge = win.screenX + xDiff + $(window).outerWidth();
        var bottomEdge = win.screenY + yDiff + $(window).outerHeight();
        var resizeWidth = Math.min(0, screen.availWidth - rightEdge);
        var resizeHeight = Math.min(0, screen.availHeight - bottomEdge);
        win.resizeBy(resizeWidth, resizeHeight);
        win.moveBy(xDiff, yDiff);
    };

    /*
     ### MASTER WINDOWS ONLY
     _Methods specific to 'master' windows_
     */

    /**
     * #### closeAllChildren
     * Close all children of a parent
     * Defaults to current parent
     * options.silent to close windows
     * `` without removing the window from memory
     */
    wm.closeAllChildren = function(options) {
        options = options || {};
        var parentName = options.parent;
        if(options.silent) {
            this.send({
                name: 'closeSilent',
                parent: parentName
            });
        } else {
            this.send({
                name: 'closeWindow',
                parent: parentName
            });
        }
    };
    /**
     * openAllChildren
     * @param options
     * @returns {Array}
     */
    wm.openAllChildren = function(options) {
        options = options || {};
        var parentName = options.parent;
        var wins = [];
        each(this.getAllWindows(parentName), function(win, name) {
            if(win.type != "master") {
                wins.push(this.openWindow({
                    name: name,
                    parent: parentName
                }));
            }
        }, this);
        return wins;
    };

    /*
     ## INTERNAL METHODS
     */
    /**
     * Update the UID
     */
    wm._updateCachedUID = function() {
        this.cached.uid = parseInt(Math.random().toString().slice(5)) + new Date().getTime();
    };
    /**
     * Get the UID
     * @returns {number}
     */
    wm._getCachedUID = function() {
        return this.cached.uid;
    };
    /**
     * Get messages for window
     * @param name
     * @param parent
     * @returns {*}
     */
    wm._getMessages = function(name, parent) {
        this.refreshCache();
        var cachedMsgParent = this._getCachedMessageParent(parent);
        if(!cachedMsgParent) return;
        return cachedMsgParent[name] || {};
    };
    /**
     * Remove a message
     * @param msg
     */
    wm._removeMsgFromMessages = function(msg) {
        this.refreshCache();
        this._removeCachedMessage(msg);
        this.updateMemory();
    };
    /**
     * Force the window manager to check its messages
     */
    wm._checkMessages = function(name) {
        this.refreshCache();
        var msgs = this._getMessages(name || this.name);
        each(msgs, function(msg){
            var eventObj = {
                from: msg.from,
                to: msg.to,
                parent: msg.parent,
                fromParent: msg.fromParent
            };
            this._removeMsgFromMessages(msg);
            this.trigger.apply(this, [msg.name, eventObj].concat(msg.args));
        }, this);
    };
    /**
     * Remove a window from memory
     * @param name
     */
    wm._removeWindowFromWindows = function(name) {
        this.refreshCache();
        this._removeCachedWindow(name);
        this.updateMemory();
        if(this.type == "external") return;
        this.send({
            name: "windowRemoved",
            to: this.parent
        }, name, this.parent);
        this.send({
            name: "windowRemoved:" + name,
            to: this.parent
        }, this.getWindow(name));
    };
    /**
     * Takes an object that accepts -
     * name:String the name of the this window
     * type:String (Optional) either 'master','sub' or 'external'.
     * `` If left blank defaults to 'master' in case parent is not specified
     * `` If parent is specified type is automatically changed to sub
     * parent:String (Optional for non sub types) the parent name of its parent.
     * @param obj
     * @param force
     */
    wm._registerWindow = function(obj, force) {
        //Setup cache object
        this.refreshCache();
        //Setup current window
        this.type = (obj.type == "master") ? "master" : (obj.type) ? obj.type : "sub";
        this.sticky = 0;
        this.parent = (obj.type == "external" && !obj.parent) ? "external" : (this.type == "master") ? obj.name : obj.parent;
        if(this.type == "sub" && this.parent == null) console.error("Missing parent window name for type sub");
        this.name = obj.name;

        //Some browsers change window.outerHeight to be some small number when the window is minimized.
        //window.innerHeight, however remains the real value.
        //We check to make sure that window.outerHeight > window.innerHeight, and if not, we assume
        //the outerHeight is invalid and don't cache the window
        if(!Config.isValidWindow(window)) return;
        var parent = this.parent;
        var name = this.name;
        var cachedWin = this._getCachedWindow({
            name: name,
            parent: parent
        });
        if(!cachedWin || force) {
            var winVal = extend(
                {
                    name: name,
                    type: "sub",
                    props : {}
                },
                (cachedWin || {}),
                {
                    windowName: window.name,
                    title: document.title,
                    type: this.type,
                    location: window.location.href,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    left: window.screenX,
                    top: window.screenY,
                    isOpen: true
                }
            );
            this._addCachedWindow(name, winVal);
        }
        this.updateMemory();
        if(this.type == "sub") {
            this.send({
                name: "windowAdded",
                to: this.parent
            }, name, this.getWindow(name));
            this.send({
                name: "windowAdded:" + this.name,
                to: this.parent
            }, this.getWindow(name));
        }
    };
    /**
     * Internal method for adding a message to message cache
     * Any additional arguments are passed on to as the second arguments of the message callback
     * @param obj
     * @param obj.name {string} Name of the message
     * @param obj.to {string|string[]} Recipient(s) of the message
     * @param obj.parent {string} _Parent_ of the recipient(s) of the message
     * @private
     */
    wm._addCachedMessage = function(obj) {
        var recipients = obj.to;
        var msgName = obj.name;
        var parent = obj.parent || this.parent;
        var args = Array.prototype.slice.call(arguments, 1);
        var to;
        if(recipients) {
            if(typeof recipients !== "string" && !(recipients instanceof Array)) console.error("Incorrect recipient type for windowManager send method");
            to = (typeof recipients === "string") ? [recipients] : recipients;
        } else {
            to = _without(_keys(this.getAllWindows(obj.parent)), this.name);
        }
        this._updateCachedUID();
        var obj = {
            parent: parent
        };
        //Add message only if recipients have been provided
        if(to.length) {
            this._addCachedMessageParent(obj);
            var cachedParent = this._getCachedMessageParent(obj);
            each(to, function(recipientName) {
                if(!cachedParent[recipientName]) cachedParent[recipientName] = {};
                var msgUID = "msg" + this._getCachedUID();
                cachedParent[recipientName][msgUID] = {
                    name: msgName,
                    ts: new Date().getTime(),
                    uid: msgUID,
                    parent: parent,
                    to: recipientName,
                    from: this.name,
                    fromParent: this.parent,
                    args: args
                };
            }, this);
        }
    };
    /**
     * Removes the given message from the cache
     * @param msg
     * @private
     */
    wm._removeCachedMessage = function(msg) {
        var cachedParent = this._getCachedMessageParent(msg.parent);
        delete cachedParent[msg.to][msg.uid];
        if(!_keys(cachedParent[msg.to]).length) delete cachedParent[msg.to];
        if(!_keys(cachedParent)) delete this.cached.msgs[msg.parent];
    };
    /**
     * Clears messages older than the Config.msgTimeout time
     * @private
     */
    wm._clearOldMessages = function() {
        var hasUpdate = false;
        each(this.cached.msgs, function(cachedMsgParent, parentKey) {
            each(cachedMsgParent, function(cachedMsgWindow, key) {
                each(cachedMsgWindow, function(msg, msgName) {
                    if(new Date().getTime() - msg.ts > Config.msgTimeout) {
                        this._removeCachedMessage(msg);
                        hasUpdate = true;
                    }
                }, this);
            }, this);
        }, this);
        if(hasUpdate) this.updateMemory();
    };
    /**
     * Clears all the messages for a given window
     * @param name
     * @param parent
     * @private
     */
    wm._clearCachedMessagesForWindow = function(name, parent) {
        var obj = (isObject(name)) ? name : { name:  name, parent: parent };
        var cachedParent = this._getCachedMessageParent(obj);
        if(!cachedParent) return;
        delete cachedParent[obj.name];
    };
    /**
     * Clears all the messages for a given parent window
     * @param parentName
     * @private
     */
    wm._clearCachedMessages = function(parentName) {
        var obj = (isObject(parentName)) ? parentName : { parent: parentName };
        var parent = obj.parent || this.parent;
        delete this.cached.msgs[parent];
    };
    /**
     * Gets the object representating messages for a given parent
     * @param obj
     * @returns {*}
     * @private
     */
    wm._getCachedMessageParent = function(obj) {
        obj = (isObject(obj)) ? obj : { parent: obj };
        var parent = obj.parent || this.parent;
        return this.cached.msgs[parent];
    };
    /**
     * Adds a cache for messages on a given parent
     * @param parentName
     * @private
     */
    wm._addCachedMessageParent = function(parentName) {
        var obj = (isObject(parentName)) ? parentName : { parent: parentName };
        this.cached.msgs[obj.parent] = this.cached.msgs[obj.parent] || {};
    };
    /**
     * Adds a cache for windows on a given parent
     * @param parentName
     * @private
     */
    wm._addCachedWindowParent = function(parentName) {
        var obj = (isObject(parentName)) ? parentName : { parent: parentName };
        this.cached.windows[obj.parent] = this.cached.windows[obj.parent] || {};
    };
    /**
     * Retrieves the cache for windows on a given parent
     * @param parentName
     * @private
     */
    wm._getCachedWindowParent = function(parentName) {
        var obj = (isObject(parentName)) ? parentName : { parent: parentName };
        var parent = obj.parent || this.parent;
        return this.cached.windows[parent];
    };

    /**
     * Removes the cache for windows on a given parent
     * @param parentName
     * @private
     */
    wm._removeCachedWindowParent = function(parentName) {
        var obj = (isObject(parentName)) ? parentName : { parent: parentName };
        delete this.cached.windows[obj.parent];
    };
    /**
     * Gets a given window from cache
     * @param name
     * @param parent
     * @returns {*}
     * @private
     */
    wm._getCachedWindow = function(name, parent) {
        var obj = (isObject(name)) ? name : { name: name, parent: parent || this.parent };
        var cachedParent = this._getCachedWindowParent(obj);
        if(!cachedParent) return;
        var win = obj.name;
        return cachedParent[win];
    };
    /**
     * Gets the current window from cache
     * @returns {*}
     * @private
     */
    wm._getCurrentCachedWindow = function() {
        return this._getCachedWindow({
            name: this.name
        });
    };
    /**
     * Removes a window from cache
     * @param name
     * @private
     */
    wm._removeCachedWindow = function(name) {
        var obj = (isObject(name)) ? name : { name: name, parent: this.parent };
        var cachedParent = this._getCachedWindowParent(obj.parent);
        delete cachedParent[obj.name];
    };
    /**
     * Adds a window to cache
     * @param name
     * @param val
     * @private
     */
    wm._addCachedWindow = function(name, val) {
        var obj = (isObject(name)) ? name : { name: name, parent: this.parent};
        this._addCachedWindowParent(obj);
        var cachedParent = this._getCachedWindowParent(obj);
        cachedParent[obj.name] = val;
    };
    /**
     * Sets  a window to cache
     * @param name
     * @param val
     * @private
     */
    wm._setCachedWindow = wm._addCachedWindow;
    /**
     * Adds a reference object for a window instance
     * @param windowName
     * @param parentName
     * @param win
     * @returns {*}
     * @private
     */
    wm._addWindowRefObj = function(windowName, parentName, win) {
        var windowRefParent = parentName || this.parent;
        this.windowRefs[windowRefParent] = this.windowRefs[windowRefParent] || {};
        this.windowRefs[windowRefParent][windowName] = this.windowRefs[windowRefParent][windowName] || {};
        var windowRefObj = this.windowRefs[windowRefParent][windowName];
        windowRefObj.popup = win;
        windowRefObj.unloadCount = 0;
        return windowRefObj;
    };
    /**
     * Removes the reference object for a window instance
     * @param windowName
     * @param parentName
     * @private
     */
    wm._removeWindowRefObj = function(windowName, parentName) {
        var windowRefParent = parentName || this.parent;
        if(!this.windowRefs[windowRefParent]) return;
        delete this.windowRefs[windowRefParent][windowName];
    };
    /**
     * Retrieves the reference object for a window instance
     * @param windowName
     * @param parentName
     * @private
     */
    wm._getWindowRefObj = function(windowName, parentName) {
        parentName = parentName || this.parent;
        if(this.windowRefs[parentName] &&
            this.windowRefs[parentName][windowName])
            return this.windowRefs[parentName][windowName];
    };
    /**
     * Removes the isOpen property from a cached window
     * @param windowName
     * @param parentName
     * @private
     */
    wm._setWindowToClosed = function(windowName, parentName) {
        var cachedWin = this._getCachedWindow({
            name: windowName,
            parent: parentName
        });
        if(cachedWin) delete cachedWin.isOpen;
        this._setCachedWindow(windowName, cachedWin);
    };
    /**
     * Sets the unload event removing the window reference from
     * cache when the window is closed
     * @param windowName
     * @param parentName
     * @param win
     * @private
     */
    wm._setPopupUnloadHandler = function(windowName, parentName, win) {
        var _this = this;
        var windowRefObj = this._getWindowRefObj(windowName, parentName);
        $(win).unload(function() {
            windowRefObj.unloadCount++;
            // Special handled for possible bug
            if(Config.hasDoubleUnloadBug && windowRefObj.unloadCount < 2) return;
            _this._removeWindowRefObj(windowName, parentName);
        });
    };
    /**
     * Unsets the unload event for removing window reference from cache
     * @param windowName
     * @param parentName
     * @private
     */
    wm._unsetPopupUnloadHandler = function(windowName, parentName) {
        var windowRefObj = this._getWindowRefObj(windowName, parentName);
        if(!windowRefObj || !windowRefObj.popup) return;
        $(windowRefObj.popup).off('unload');
    };
    /*
     ### Event Handling
     */
    /**
     * Setup Event Bindings
     */
    wm._setupEventBindings = function() {
        var _this = this;

        //Bind main event handlers
        $(window).on('storage', bind(this._changeHandler, this));
        window.onunload = bind(this._unloadHandler, this);
        var closeWindowHandler = function(evt, options) {
            options = options || {};
            if(this.sticky || options.silent) {
                this.makeWindowCloseSilent();
            }
            window.close();
        };
        var closeSilentHandler = function(evt, silent) {
            if(this.sticky) this.sticky-- ;
            if(!this.sticky) {
                this.closeSilent = true;
                window.close();
            }
        };
        var pingWindowRequestHandler = function(evt) {
            this.send({
                name: 'pingWindowResponse',
                to:  evt.from,
                parent: evt.fromParent
            });
        };
        var pingWindowResponseHandler = function() {
            this.pingDfd.resolveWith(null, [true]);
        };
        var resizeByHandler = function(evt, xDiff, yDiff){
            console.log('moving', xDiff, yDiff);
            this.moveWindowBy(window, xDiff, yDiff);
        };

        // Bind event Handlers for position and size
        var windowPositionTimerHandler = bind(function() {
            if(!this.currentPos) this.currentPos = {};
            var newPos = {left: window.screenX, top: window.screenY};
            if(!_isEqual(this.currentPos,newPos)){
                this.setCurrentWindow();
                this.currentPos = newPos;
            }
        }, this);
        var windowResizeHandler = _debounce(function(){
            _this.setCurrentWindow();
        }, 300);
        //Bind Event Handler for window closes
        this.on('closeWindow', closeWindowHandler, this);
        //Bind Event Handler for silent window closes
        this.on('closeSilent', closeSilentHandler, this);
        /*
         Bind Close Event Handler for reopen window
         Note:This handler is only for sub windows since
         master windows cannot close and open
         themselves. That logic is handled within
         the this.popupWindow itself
         */
        this.on('pingWindowRequest', pingWindowRequestHandler, this);
        this.on('pingWindowResponse', pingWindowResponseHandler, this);

        /*
            For only non-external windows
         */
        if(this.type != "external") {
            this.windowPosTimer = setInterval(windowPositionTimerHandler, 5000);
            //Bind event handler for resize
            $(window).on('resize', windowResizeHandler);
        }
    };

    /**
     *  Change handler to listen for localStorage changes.
     * @param evt
     */
    wm._changeHandler = function(evt) {
        if(!Config.isValidWindow(window)) return;
        if(evt) var versionCheck = (evt.originalEvent.key == this.namespace || evt.originalEvent.key == this.namespace + 'setBit');
        if(versionCheck) {
            this._checkMessages();
        }
    };
    /**
     * Handler fired before any window is closed.
     * @param evt
     */
    wm._unloadHandler = function(evt) {
        //If the window is the master
        if(this.type == "master") {
            //If its not close silent
            if(!this.closeSilent) {
                this.closeAllChildren({
                    silent: true
                });
            }
        } else {
            this.send({
                name: "windowClosed:" + this.name,
                to: this.parent
            }, this.parent);
            //Its a sub window
            //If it has NOT been flagged to be silently closed
            //Fire the close function
            if(!this.closeSilent) {
                this._removeWindowFromWindows(this.name);
            }
        }
        this._setWindowToClosed(this.name, this.parent);
        this._clearCachedMessagesForWindow(this.name, this.parent);
        this.updateMemory();
    };

    return WindowManager;
}));