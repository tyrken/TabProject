"use strict";

var Popup = (function (TPM) {
  var my = {};

  function isBlank(str) {
    return (!str || /^\s*$/.test(str));
  }

  my.addNewProject = function () {
    var name = $('#newProjectName').val();
    if (isBlank(name)) {
      alert("You must enter a Project Name first!");
      return;
    }
    var projectPageUrl = TPM.getProjectPageUrl(name);
    chrome.tabs.create({url:projectPageUrl});
  };

  my.init = function () {
    // TODO enable button on name !blank
    $('#newProjectButton').click( function() {
      my.addNewProject();
    });

    TPM.scanTabsForProjects(function(projects) {
      var items = ['<ul>'];
      $.each(projects, function(i, project) {
        items.push('<li>'+project.name+'</li><ul>');
        $.each(project.tabDescs, function(j, tabDesc) {
          items.push('<li>'+tabDesc.title+'</li>');
        });
        items.push('</ul>');
      });  // close each()
      if (projects.length === 0) {
        items.push('<li>No Projects defined yet!</li>');
      }
      items.push('</ul>');
      $('#projectList').append( items.join('') );

      TPM.makeAllBookmarks(projects);
    });
  };

  return my;
}(TPM));

document.addEventListener('DOMContentLoaded', function () {
  Popup.init();
});


