requirejs.config({
  //appDir: ".",
  //baseUrl: "",
  paths: {
    'jquery': ['lib/jquery'],
    'bootstrap': ['lib/bootstrap'],
    'tabproject': ['js/tabproject']
    'jasmine': ['lib/jasmine-1.3.1/jasmine']
    'jasmine-html': ['lib/jasmine-1.3.1/jasmine-html']
    'jasmine-gui': ['test/jasmine-gui']
    },
  shim: {
    /* Set bootstrap dependencies (just jQuery) */
    'bootstrap' : ['jquery']
  }
});
