# Inter-Window Communication

## Demo

<div class="clear"></div>
<div class="left">
	In this example, we send a message between windows as well as set and get properties on a window.
</div>
<iframe src="../resources/demos/demo1.html" class="demo-frame" style="height:300px"></iframe>

<div class="clear"></div>

## Code


<div class="spacer"></div>
<div class="left">
Create a WindowManager instance and popup our sub window.
</div>

```javascript
	var wm = new WindowManager({
		name: 'launch',
		type: 'master',
		namespace: 'windowManagerDemo1'
	});
	wm.popupWindow({
		name: 'subPage1',
		location: 'demo-sub-page-2.html',
		left: window.screenX + window.outerWidth,
		focus: true
	});
```

<div class="clear"></div>
<div class="left">
	Define our click event on the red button. This set the backgroundColor property on the sub window and sends
	a message for it to set its background color based on the property.
</div>

```javascript
   $('.red-btn').on('click', function() {
        wm.setProperty('backgroundColor', 'red', 'subPage1');
        wm.send({
            name: 'setBackgroundColor',
            to: 'subPage1'
        });
    });
```
<div class="clear"></div>
<div class="left">
	On the sub window we setup a window manager instance and listen for the message to set our background color
	based on the property.
</div>

```javascript
	var wm = new WindowManager({
		name: 'subPage1',
		parent: 'launch',
		namespace: 'windowManagerDemo2'
	});
	wm.on('setBackgroundColor', function(evt) {
	   var bgColor = wm.getProperty('backgroundColor');
	   $(document.body).css('background', bgColor);
	});
```
<div class="clear"></div>

<div class="left">
	Define our click event on the red button. Same as blue button above.
</div>

```javascript
    $('.blue-btn').on('click', function() {
        wm.setProperty('backgroundColor', 'blue', 'subPage1');
        wm.send({
            name: 'setBackgroundColor',
            to: 'subPage1'
        });
    });
```
<div class="clear"></div>