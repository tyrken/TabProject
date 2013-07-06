buster.spec.expose(); // Make some functions global

/*requirejs.config({
  appDir: ".",
  baseUrl: "js",
  paths: {
    'jquery': ['lib/jquery'],
    'bootstrap': ['lib/bootstrap'],
    'tabproject': ['lib/tabproject']
    },
  shim: {
    'bootstrap' : ['jquery']
  }
});
*/

define(['jquery', 'tabproject'], function($, sut) {
  describe("A module 2", function () {
    it("states the obvious 2", function () {
      expect(true).toEqual(true);
    });
  });
  /*
    buster.testCase("A test case", {
        "test the module": function(){
            assert.isObject(sut);
        }
    }); */
});

/*
require(['jquery', 'bootstrap', 'tabproject'], function($, bootstrap, TPM) {

  describe("A module 2", function () {
    it("states the obvious 2", function () {
      expect(true).toEqual(true);
    });
  });
});
*/
