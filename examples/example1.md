# Basic Example

## Demo

<div class="clear"></div>
<div class="left">
	In this basic example, we demonstrate popping up a window, focusing and closing it.
</div>
<iframe src="../resources/demos/demo1.html" class="demo-frame" style="height:300px"></iframe>

<div class="clear"></div>

## Code


<div class="spacer"></div>
<div class="left">
Create a WindowManager instance.
</div>

```javascript
	var wm = new WindowManager({
        name: 'launch',
        type: 'master',
        namespace: 'windowManagerDemo1'
    });
```

<div class="clear"></div>
<div class="left">
	Define our click event on the open button. Popup a window with a location. 
	The target page must also have a WindowManager instance with the name 'subPage1'.
</div>

```javascript
    $('.open-btn').on('click', function() {
        wm.popupWindow({
            location: 'demo-sub-page-1.html',
            name: 'subPage1',
            left: window.screenX + window.outerWidth
        });
    });
```
<div class="clear"></div>
<div class="left">
	Define our click event on the open button. Popup a window with a location. 
	The target page must also have a WindowManager instance with the name 'subPage1'.
</div>

```javascript
    $('.open-btn').on('click', function() {
        wm.popupWindow({
            location: 'demo-sub-page-1.html',
            name: 'subPage1',
            left: window.screenX + window.outerWidth
        });
    });
```
<div class="clear"></div>
<div class="left">
	Define our click event on the close button.
</div>

```javascript
    $('.close-btn').on('click', function() {
        wm.closeWindow('subPage1');
    });
```
<div class="clear"></div>
<div class="left">
	Define our click event on the focus button.
</div>

```javascript
    $('.focus-btn').on('click', function() {
		wm.focusWindow({
			name: 'subPage1'
		});
	});
```