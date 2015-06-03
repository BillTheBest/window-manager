require(['mocha','chai','windowmanager'], function(Mocha, Chai, WindowManager) {
    var chai = window.Chai;
    var assert = Chai.assert;
    var wm = window.wm = new WindowManager({
        name: "mainWindow",
        namespace: "windowManager01",
        type: "master"
    });
    var ctx = this;
    var openSubWindow = function(cb) {
        wm.on('windowAdded:subWindow1', cb, ctx);
        return wm.popupWindow({
            location: 'sub-window-1.html',
            name: "subWindow1"
        });
    };
    var closeSubWindow = function(cb) {
        wm.on('windowClosed:subWindow1', function() {
            cb();
        }, ctx);
        wm.closeWindow('subWindow1');
    };
    describe('Window Manager', function () {
        afterEach(function(){
            wm.off(null, null, ctx);
        });
        describe('popup and close windows', function() {
            it('should popup and close a window by name', function(cb) {
                this.timeout(4000);
                openSubWindow(function() {
                    assert.equal(true, win != null);
                });
                var win = openSubWindow(function() {
                    assert.equal(true, win != null);
                    closeSubWindow(cb);
                });
            });
        });
        describe('get and set window properties', function() {
            it('set, get and delete properties on the current window', function() {
                wm.setProperty('myProp', "foo");
                assert.equal("foo", wm.getProperty('myProp'));
                wm.deleteProperty('myProp');
                assert.equal(undefined, wm.getProperty('myProp'));
            });
            it('set, get and delete properties on a sub window', function(cb) {
                this.timeout(4000);
                var win;
                win = openSubWindow(function() {
                    wm.setProperty('myProperty', {foo: "bar"}, 'subWindow1');
                    var prop = wm.getProperty('myProperty', 'subWindow1');
                    assert.equal("bar", prop.foo);
                    wm.deleteProperty('myProperty', 'subWindow1');
                    var prop2 = wm.getProperty('myProperty', 'subWindow1');
                    assert.equal(undefined, prop2);
                    closeSubWindow(cb);
                })
            });
        });
    });
    mocha.run();
});
