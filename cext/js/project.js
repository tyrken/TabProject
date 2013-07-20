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
    var items = ['<ul class="projectContent clearfix">'];
    project.links.forEach(function(link) {
      var iconClass = link.bookmarked ? 'icon-star' : 'icon-star-empty';
      var activityClass = link.active ? 'active' : 'inactive';

      items.push('<li><i class="'+iconClass+'"></i> <a href="' + link.url + '" class="'+activityClass+'">' + link.title + '</a></li>');
    });
    if (project.links.length === 0) {
      items.push('<li>No project content yet!</li>');
    }
    items.push('</ul>');
    $('#projectContent').html(items.join(''));

    $('i[class="icon-star-empty"]').on('click', function(event) {
      var icon = $(this);
      var link = icon.next();
      //console.log('icon-click', link);
      tp.saveBookmark(project, link.attr('href'), link.text(), function(node) {
        icon.attr('class', 'icon-star');
      });
    });

    $('a[class="inactive"]').on('click', function(event) {
      event.preventDefault();
      var anchor = $(this);
      chrome.tabs.create({
        url: $(this).attr('href'),
        windowId: project.tabWindowId,
        index: project.tabIndex+1,
        openerTabId: project.tabId,
        active: false
      }, function(tab) {
        var li = anchor.parent();
        li.parent().prepend(li);
        anchor.attr('class', 'active');
        //tp.lookupProjectContent(projectName, displayProjectContent);
      });
    });

   displayProjectSettings(project);
  }

  function refresh() {
    tp.lookupProjectContent(projectName, displayProjectContent);
  }

  $(document).ready(function(){
    refresh();

    chrome.tabs.onActivated.addListener( function(info) {
      if (info.tabId === project.tabId && info.windowId === project.windowId) {
        refresh();
      }
    });
  });

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
      project.links.forEach(function(link) {
        if (!link.active) {
          chrome.tabs.create({
            url: link.url,
            windowId: project.tabWindowId,
            index: ++lastIndex,
            openerTabId: project.tabId
          });
        } else {
          lastIndex = link.tabIndex;
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
      project.links.forEach(function(link) {
        if (link.active && !link.bookmarked) {
          unsaved.push(link);
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
        project.links.forEach(function(link) {
          if (link.active && link.tabId >= 1) {
            tabIds.push(link.tabId);
          }
        });
        chrome.tabs.remove(tabIds);
      }
    }, projectName);
  });

});