<div class="project-header">
    <div class="project-name">Advice</div>
    <div class="intro">
        Advice makes it possible to to encapsulate behaviors on objects in the form of functional 'mixins' giving us composability and code reuse.
        <i>It is based on the Advice <a href="https://github.com/twitter/flight/blob/master/lib/advice.js" target="_blank">functional mixin library</a>
                    by <a href="https://twitter.com/angustweets" target="_blank">Angus Croll</a>.</i>
    </div>
</div>

## Source ##

Read the annotated source <a href="advice.js.html" target="_blank">here</a>


<div class="clear"></div>
<div class="spacer"></div>

## Overview ##
<div class="left">
Classical inheritance starts to become complicated when creating complex components, take this for example:
</div>

```
               ______BaseList________
              |          |           |
      GroupedList    ImageList    CarouselList
          |                |
    NestedItemList     CarouselImageList

```

<div class="clear"></div>

<div class="left">
This structure is rigid and highly dependent on parent logic. If you wanted to have a GroupedImageList (GroupedList + ImageList) you would have to re-arrange the hierarchy or duplicate code.  The same problem exists for the CarouselImageList, which must duplicate carousel functionality which in this structure could potentially be
a child of either ImageList or CarouselImageList, both choices resulting in code duplication.

Advice enables better separation of inherited functionality by enabling the extraction of shared code and incorporation via mixins instead of through inheritance. Using Advice, the previous component structure can be restructured as:
</div>

```
                _______________________ BaseList_________________________
               |          |             |                  |             |
      GroupedList         |         ImageList              |         CarouselList
(BaseList + groupMethods) |  (BaseList + imageMethods)     |    (BaseList + carouselMethods)
                          |                                |
                NestedItemList                         CarouselImageList
 (BaseList + groupMethods + nestedMethods)     (BaseList + carouselMethods + imageMethods)

```

<div class="clear"></div>

With Advice, adding grouped, nested, carousel or image logic to any other list is as simple as applying the methods with mixins. Code is not duplicated and only affects the scope to which it is added.

## Examples ##
<a href="docs/basic.md.html">Basic example</a>
<div class="clear"></div>
<a href="docs/simple-backbone.md.html">Simple example with a Backbone app</a>
<div class="clear"></div>
<a href="docs/complex-backbone.md.html">Complex example with a Backbone app</a>
<div class="clear"></div>

## API ##

### addAdvice ###
Add all listed methods to the provided object
#### addAdvice(object) ####
- `object` - [_Object_] the object to add _Advice_ to

Example:
```
var myObject = {
    'doSomething': function(val) {
        console.log("Running doSomething() with " + val);
    }
};
Advice.addAdvice(myObject);
```
After running this code, all subsequent methods will be available on the object.

### around ###
Will call the new function around the existing one
#### around(method, function) ####
- `method` - [_String_] the name of the object's function to attach your method.
- `function` - [_Function (originalFunction, arguments)_] the function to call around the original method

Example:
```
var myObject = {
    'doSomething': function(val) {
        console.log("Running doSomething() with " + val);
    }
};
Advice.addAdvice(myObject);
myObject.around('doSomething', function(originalFunction, val) {
    console.log("Running before doSomething() with " + val);
    originalFunction(val);
	console.log("Running after doSomething() with " + val);
});
```

#### around(methods) ####
- `methods` - [_Object_] an object with keys corresponding to named functions with the object, and values which contain the function to attach to each named function

Example:
```
var myObject = {
    'doSomething': function(val) {
        console.log("Running doSomething() with " + val);
    }
};
Advice.addAdvice(myObject);
myObject.around({
	'doSomething': function(originalFunction, val) {
    	console.log("Running before doSomething() with " + val);
    	originalFunction(val);
		console.log("Running after doSomething() with " + val);
	}
});
```
### before ###
Will call the new function before the old one with same arguments
#### before(method, function) ####
- `method` - [_String_] the name of the object's function to attach your method.
- `function` - [_Function (arguments)_] the function to call prior to calling the original method

Example:
```
var myObject = {
    'doSomething': function(val) {
        console.log("Running doSomething() with " + val);
    }
};
Advice.addAdvice(myObject);
myObject.before('doSomething', function(val) {
    console.log("Running before doSomething() with " + val);
});
```

#### before(methods) ####
- `methods` - [_Object_] an object with keys corresponding to named functions with the object, and values which contain the function to attach to each named function

Example:
```
var myObject = {
    'doSomething': function(val) {
        console.log("Running doSomething() with " + val);
    }
};
Advice.addAdvice(myObject);
myObject.before({
    'doSomething': function(val) {
        console.log("Running before doSomething() with " + val);
    }
});
```
### after ###
Will call the new function after the old one with same arguments
#### after(method, function) ####
- `method` - [_String_] the name of the object's function to attach your method.
- `function` - [_Function (arguments)_] the function to call prior to calling the original method

Example:
```
var myObject = {
    'doSomething': function(val) {
        console.log("Running doSomething() with " + val);
    }
};
Advice.addAdvice(myObject);
myObject.after('doSomething', function(val) {
    console.log("Running after doSomething() with " + val);
});
```

#### after(methods) ####
- `methods` - [_Object_] an object with keys corresponding to named functions with the object, and values which contain the function to attach to each named function

Example:
```
var myObject = {
    'doSomething': function(val) {
        console.log("Running doSomething() with " + val);
    }
};
Advice.addAdvice(myObject);
myObject.after({
    'doSomething': function(val) {
        console.log("Running after doSomething() with " + val);
    }
});
```
### clobber ###
Override properties on an object with new values
#### clobber(method, function) ####
- `key` - [_String_] the name of the object's property to override
- `value` - [_Anything_] the value to set the property to

Example:
```
var myObject = {
    'doSomething': function(val) {
        console.log("Running doSomething() with " + val);
    }
};
Advice.addAdvice(myObject);
myObject.clobber('doSomething', function(val) {
    console.log("Running instead of usual doSomething() with " + val);
});
```

#### clobber(keys) ####
- `keys` - [_keys_] an object with keys corresponding to the object's properties to override

Example:
```
var myObject = {
    'doSomething': function(val) {
        console.log("Running doSomething() with " + val);
    }
};
Advice.addAdvice(myObject);
myObject.clobber({
    'doSomething': function(val) {
        console.log("Running instead of usual doSomething() with " + val);
    }
);
```
### addToObj ###
will extend all key-values in a the base object, given another objects key-values
#### addToObj(keys) ####
- `keys` - [_Object_] an object with keys corresponding to the object's properties to extend

Example:
```
var myObject = {
    'property': {
        'score': 1
    }
};
Advice.addAdvice(myObject);
myObject.addToObj({
    'property': {
        'rank': 2
    }
);
```
After running this code, `myObject` will be:
```
{
    'property': {
        'score': 1,
        'rank': 2
    }
};
```
### setDefaults ###
Acts like a guarded extend. Will only set the given key-values on the base if they don't already exist
#### setDefaults(keys) ####
- `keys` - [_Object_] an object with keys corresponding to the object's for which to set defaults

Example:
```
var myObject = {
    'property': {
        'score': 1
    }
};
Advice.addAdvice(myObject);
myObject.setDefaults({
    'property': {
        'score': 3
    },
    'enabled': true
);
```
After running this code, `myObject` will be:
```
{
    'property': {
        'score': 1
    },
    'enabled': true
}
```
### findVal ###
Utility function for finding a value in a prototype chain
#### findVal(key) ####
- `key` - [_String_] the name of the property to search for
Example:
```
var myObject = {
    'property': {
        'score': 1
    }
};
Advice.addAdvice(myObject);
myObject = myObject.findVal('property');
```
After running this code, `myObject` will be:
```
{
    'score': 1
}
```

## Usage ##
<div class="left">
There are a number of ways of adding advice to an object. But first, one must add the advice API to a given object class.
</div>

```javascript
Advice.addAdvice(recipientOfAdvice);
```

<div class="clear"></div>
