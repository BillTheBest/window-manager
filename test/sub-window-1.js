require(['windowmanager'], function(WindowManager) {
    var wm = window.wm = new WindowManager({
        name: "subWindow1",
        namespace: "windowManager01",
        parent: "mainWindow"
    });
    wm.on('messageRequest', function(req) {
        wm.send({
            to: req.from,
            name: 'messageResponse'
        }, {foo: "bar"});
    });
    wm.on('addWindowProperty', function(req, key, val) {
        wm.setProperty(key, val);
        wm.send({
            to: req.from,
            name: 'windowPropertyAdded'
        }, key);
    });
});
