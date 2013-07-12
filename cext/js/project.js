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
    'bootstrap': ['jquery']
  }
});

require(['jquery', 'bootstrap', 'tabproject', 'utils'], function($, bootstrap, tp, utils) {
  "use strict";

  console.log("Loaded project via require");

  var projectName = utils.getParameterByName(window.location.search, 'name');

  function displayProjectSettings(project) {
    $('#autosave').prop('checked', project.autosave);
    $('#autoopen').prop('checked', project.autoopen);
    $('#saveAll').prop('enabled', !project.autosave);
    document.title = project.name;
    $('#projectName').text(project.name);
    window.history.replaceState({}, project.name, project.url);
  }

  function displayProjectContent(project) {
    var items = ['<ul>'];
    project.tabDescs.forEach(function(tabDesc) {
      items.push('<li><a href="' + tabDesc.url + '">' + tabDesc.title + '</a>');
      if (tabDesc.bookmarked) items.push(' B ');
      if (tabDesc.active) items.push(' A ');
      items.push('</li>');
    });
    if (project.tabDescs.length === 0) {
      items.push('<li>No project content yet!</li>');
    }
    items.push('</ul>');
    $('#projectContent').html(items.join(''));

    displayProjectSettings(project);
  }

  $(tp.lookupProjectContent(projectName, displayProjectContent));

  $('input:checkbox').on('click', function(event) {
    var param = $(this).attr('id') === 'autosave' ? 'as' : 'ao';
    var newValue = $(this).is(':checked');
    tp.updateProjectHashParamInDB(projectName, param, newValue, function(project) {
      displayProjectSettings(project);
    });
  });

  $('#openAll').on('click', function(event) {
    tp.lookupProjectContent(projectName, function(project) {
      var lastIndex = project.tabIndex;
      project.tabDescs.forEach(function(td) {
        if (!td.active) {
          chrome.tabs.create({
            url: td.url,
            windowId: project.tabWindowId,
            index: ++lastIndex,
            openerTabId: project.tabId
          });
        } else {
          lastIndex = td.index;
        }
      });
    });
  });

  $('#saveAll').on('click', function(event) {
    tp.makeBookmarks(projectName, function() {
      tp.lookupProjectContent(projectName, function(project) {
        displayProjectContent(project);
        alert("Saved " + projectName);
      });
    });
  });

  $('#close').on('click', function(event) {
    tp.lookupProjectContent(projectName, function(project) {
      var unsaved = [];
      project.tabDescs.forEach(function(td) {
        if (td.active && !td.bookmarked) {
          unsaved.push(td);
        }
      });
      var answer = true;
      if (unsaved.length > 0) {
        displayProjectContent(project);
        this.answer = confirm(unsaved.length + " unsaved content in " + projectName + " project, continue to close project?");
      }
      if (answer === true) {
        console.log("Closing project " + projectName);
        var tabIds = [project.tabId];
        project.tabDescs.forEach(function(td) {
          if (td.active && td.id >= 1) {
            tabIds.push(td.id);
          }
        });
        chrome.tabs.remove(tabIds);
      }
    }, projectName);
  });

});