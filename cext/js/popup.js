requirejs.config({
  //appDir: ".",
  baseUrl: "..",
  paths: {
    'jquery': ['lib/jquery'],
    'bootstrap': ['lib/bootstrap'],
    'tabproject': ['js/tabproject'],
    'jasmine': ['lib/jasmine-1.3.1/jasmine'],
    'jasmine-html': ['lib/jasmine-1.3.1/jasmine-html'],
    'jasmine-gui': ['test/jasmine-gui'],
    'utils': ['js/utils'],
    'ichrome': ['js/ichrome']
    },
  shim: {
    /* Set bootstrap dependencies (just jQuery) */
    'bootstrap' : ['jquery']
  }
});

require(['jquery', 'bootstrap', 'tabproject', 'utils'], function($, bootstrap, TPM, utils) {
  "use strict";

  console.log("Loaded popup via require:)");

  var my = {};

  var initProjectNamePrompt = "Enter new project name here!";

  my.addNewProject = function() {
    var name = $.trim($('#newProjectName').val());
    if (name === initProjectNamePrompt || name === "") {
      alert("You must enter a Project Name first!");
      return;
    }
    var projectPageUrl = TPM.getProjectPageUrl(name);
    chrome.tabs.create({
      url: projectPageUrl
    });
  };

  my.init = function() {
    $("#newProjectName").val(initProjectNamePrompt).on('keyup input', function() {
      var name = $.trim($(this).val());
      $("#newProjectButton").prop("disabled", name === initProjectNamePrompt || name === "");
    });

    $('#newProjectButton').prop("disabled", "true").click(function() {
      my.addNewProject();
    });

    TPM.listDBProjects(function(projects) {
      var items = ['<ul>'];
      projects.forEach(function(project) {
        items.push('<li class="clickable">' + project.name + '</li>');
      });
      if (projects.length === 0) {
        items.push('<li>No Projects defined yet!</li>');
      }
      items.push('</ul>');
      $('#projectList').append(items.join(''));
      $('li.clickable').on('click', function() {
        var name = $(this).text();
        var projectPageUrl = TPM.getProjectPageUrl(name);
        chrome.tabs.create({
          url: projectPageUrl
        });
      });
    });
  };

  $(my.init);

  return my;
});