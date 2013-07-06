require.config({
  urlArgs: 'cb=' + Math.random(),
  appDir: "",
  baseUrl: "..",
  paths: {
        jquery: 'lib/jquery',
        'jasmine': 'lib/jasmine/lib/jasmine',
        'jasmine-html': 'lib/jasmine/lib/jasmine-html',
        spec: 'lib/jasmine/spec/'
    },
    shim: {
        jasmine: {
            exports: 'jasmine'
        },
        'jasmine-html': {
            deps: ['jasmine'],
            exports: 'jasmine'
        }
    }
});


require(['jquery', 'jasmine-html'], function ($, jasmine) {

    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;

    var htmlReporter = new jasmine.HtmlReporter();

    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };

    var specs = [];

    specs.push('lib/jasmine/spec/notepadSpec');



    $(function () {
        require(specs, function (spec) {
            jasmineEnv.execute();
        });
    });

});
