"use strict";

var TPM = (function () {
  var my = {};

  function startsWith(input, prefix) {
    return input.slice(0, prefix.length) === prefix;
  }

  my.getMWOPH = function () {
    return chrome.bookmarks.MAX_WRITE_OPERATIONS_PER_HOUR;
  };

  my.getMSWOPM = function () {
    return chrome.bookmarks.MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE;
  };

  var baseBookMarkName = "TabProject";

  my.ProjectPageBase = 'chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/tabproject.html?name=';

  my.getProjectPageUrl = function (name) {
    return my.ProjectPageBase + encodeURIComponent(name);
  };

  my.isProjectPageUrl = function (url) {
    return startsWith(url, TPM.ProjectPageBase);
  };

  function getParameterByName(url, name) {
    var match = new RegExp('[?&]' + name + '=([^&]*)').exec(url);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

  my.scanTabsForProjects = function (callback) {
    console.log('Starting scanTabs');
    chrome.tabs.query({}, function (tabs) {
      var projects = [];
      var curProject = null;
      $.each(tabs, function(i, tab) {
        console.log('TAB i=' + i + ', index=' + tab.index + ', title=' + tab.title);
        if (tab.index === 0) {
          curProject = null;
        }
        if (my.isProjectPageUrl(tab.url)) {
          curProject = { name: getParameterByName(tab.url, 'name'), tabDescs: [] };
          projects.push(curProject);
          console.log('FirstProjectTab', curProject);
        } else if (curProject !== null) {
          var tabDesc = { title: tab.title, url: tab.url, favIconUrl: tab.favIconUrl };
          curProject.tabDescs.push(tabDesc);
          console.log('ProjectTab', tabDesc);
        }
      });
      console.log('Finished scanTabs', projects);
      callback(projects);
    });
  };

  return my;
}());

var Scanner = (function (TPM) {
  var my = {};



  return my;
}(TPM));


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
    });
  };

  return my;
}(TPM));


document.addEventListener('DOMContentLoaded', function () {
  if (TPM.isProjectPageUrl(window.location.search)) {

  } else {
    Popup.init();
  }
});
