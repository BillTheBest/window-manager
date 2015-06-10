# Window Animation

## Demo

<div class="clear"></div>
<div class="left">
	In this example, we will animate a windows dimensions.
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
        namespace: 'windowManagerDemo3'
    });
    var subWindow = wm.popupWindow({
        name: 'subPage1',
        location: 'demo-sub-page-3.html',
        left: window.screenX + window.outerWidth,
        top: window.screenY,
        focus: true
    });
```

<div class="clear"></div>
<div class="left">
	Define our click event on the grow button. This will animate the windows dimensions to 800x800.
</div>

```javascript
    $('.grow-btn').on('click', function() {
        wm.animateWindow(subWindow, {
           innerHeight: 800,
           innerWidth: 800
        });
    });
```
<div class="clear"></div>
<div class="left">
	Define our click event on the shrink button. This will animate the windows dimensions to 400x400.
</div>

```javascript
	$('.shrink-btn').on('click', function() {
		wm.animateWindow(subWindow, {
			innerHeight: 400,
			innerWidth: 400
		});
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