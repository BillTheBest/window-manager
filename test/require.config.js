require.config({
    baseUrl: '../',
    paths: {
        //---------- LIB ----------//
        chai: 'node_modules/chai/chai',
        mocha: 'node_modules/mocha/mocha',
        sinon: 'node_modules/sinonjs/sinon',
        jquery: 'node_modules/jquery/dist/jquery',
        "lodash": 'node_modules/lodash-amd/compat',
        "windowmanager": "windowmanager",
        "backbone-events-standalone": "node_modules/backbone-events-standalone/backbone-events-standalone"
    },
    shim: {
        'underscore': {
            exports: '_'
        },
        mocha: {
            exports: "mocha",
            init: function () {
                console.log('setting up mocha');
                this.mocha.setup('bdd');
                return this.mocha;
            }
        }
    }
});