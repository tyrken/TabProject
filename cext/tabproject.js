"use strict";

function getParameterByName(url, name) {
  var match = new RegExp('[?&]' + name + '=([^&]*)').exec(url);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

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

  function makeProjectBookmarks(project, projectNode) {
    chrome.bookmarks.getChildren(projectNode.id, function (entries) {
      $.each(project.tabDescs, function(j, tabDesc) {
        var found = false;
        $.each(entries, function(k, entry) {
          if (entry.title === tabDesc.title || entry.url === tabDesc.url) {
            found = true;
            return false;
          }
        });
        if (!found) {
          chrome.bookmarks.create({'parentId': projectNode.id, 'title': tabDesc.title, url: tabDesc.url}, function(newProjectNode) {
            console.log("Added new bookmark for "+tabDesc.title);
          });
        }
      });
    });
  }

  function makeProjectFolders(projects, baseNode) {
    chrome.bookmarks.getChildren(baseNode.id, function (projectNodes) {
      $.each(projects, function(j, project) {
        var found = false;
        $.each(projectNodes, function(k, projectNode) {
          if (projectNode.title === project.name) {
            found = true;
            makeProjectBookmarks(project, projectNode);
            return false;
          }
        });
        if (!found) {
          chrome.bookmarks.create({'parentId': baseNode.id, 'title': project.name}, function(newProjectNode) {
            console.log("Added new folder for "+project.name);
            makeProjectBookmarks(project, newProjectNode);
          });
        }
      });
    });
  }

  my.makeAllBookmarks = function (projects) {
    var bookmarkBarId = '1'
    chrome.bookmarks.getChildren(bookmarkBarId, function (results) {
      var found = false;
      $.each(results, function(i, node) {
        if (node.title === baseBookMarkName) {
          makeProjectFolders(projects, node);
          found = true;
          return false;
        }
      });
      if (!found) {
        console.log("Adding base folder!");
        chrome.bookmarks.create({'parentId': bookmarkBar.id, 'title': baseBookMarkName}, function(newFolder) {
          makeProjectFolders(projects, newFolder);
        });
      }
    });
  };

  return my;
}());




