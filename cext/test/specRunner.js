require.config({
  urlArgs: 'cb=' + Math.random(),
  appDir: "",
  baseUrl: "..",
  paths: {
    jquery: 'lib/jquery',
    jasmine: 'lib/jasmine-1.3.1/jasmine',
    'jasmine-html': 'lib/jasmine-1.3.1/jasmine-html',
    ichrome: ['test/ichrome'],
    bootstrap: ['lib/bootstrap']
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


require(['jquery', 'jasmine-html'], function($, jasmine) {

  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  var htmlReporter = new jasmine.HtmlReporter();

  jasmineEnv.addReporter(htmlReporter);

  jasmineEnv.specFilter = function(spec) {
    return htmlReporter.specFilter(spec);
  };

  var specs = [];
  specs.push('test/utils-tests');
  specs.push('test/tabproject-tests');

  $(function() {
    require(specs, function(spec) {
      jasmineEnv.execute();
    });
  });

});
