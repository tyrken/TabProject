"use strict";

var Popup = (function (TPM) {
  var my = {};

  function isBlank(str) {
    return (!str || /^\s*$/.test(str));
  }

  var initProjectNamePrompt = "Enter new project name here!";

  my.addNewProject = function () {
    var name = $.trim($('#newProjectName').val());
    if (name === initProjectNamePrompt || name === "") {
      alert("You must enter a Project Name first!");
      return;
    }
    var projectPageUrl = TPM.getProjectPageUrl(name);
    chrome.tabs.create({url:projectPageUrl});
  };

  my.init = function () {
    $("#newProjectName").val(initProjectNamePrompt).on('keyup input', function() {
      name = $.trim($(this).val());
      $("#newProjectButton").prop("disabled", name === initProjectNamePrompt || name === "");
    });

    $('#newProjectButton').prop("disabled", "true").click( function() {
      my.addNewProject();
    });

    TPM.listProjects(function(projects) {
      var items = ['<ul>'];
      projects.forEach(function(project) {
        items.push('<li class="clickable">'+project.name+'</li>');
      });
      if (projects.length === 0) {
        items.push('<li>No Projects defined yet!</li>');
      }
      items.push('</ul>');
      $('#projectList').append( items.join('') );
      $('li.clickable').on('click', function() {
        var name = $(this).text();
        var projectPageUrl = TPM.getProjectPageUrl(name);
        chrome.tabs.create({url:projectPageUrl});
      });
    });
  };

  return my;
}(TPM));

document.addEventListener('DOMContentLoaded', function () {
  Popup.init();
});


