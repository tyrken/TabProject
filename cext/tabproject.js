"use strict";

function getParameterByName(url, name) {
  var match = new RegExp('[?&]' + name + '=([^&]*)').exec(url);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

if (!Array.prototype.findObject) {
  Array.prototype.findObject = function (predicate) {
    for (var i = 0, j = this.length; i < j; ++i) {
      if (predicate(this[i])) {
        return this[i];
      }
    }
    return null;
  };
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

  var bookmarkBarId = '1'
  var baseBookMarkName = "TabProject";

  my.ProjectPageBase = 'chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/project.html?name=';

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
      var projectUrl = getProjectPageUrl(project.name);
      if (!entries.findObject(function(entry) { return entry.url === projectUrl; })) {
        chrome.bookmarks.create({'parentId': projectNode.id, 'title': project.name, url: projectUrl}, function(newProjectNode) {
          console.log("Added new bookmark for project page "+project.name);
        });
      }
      $.each(project.tabDescs, function(j, tabDesc) {
        var found = entries.findObject(function(entry) { return entry.url === tabDesc.url });
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
        if (!projectNodes.findObject(function(projectNode){ return projectNode.title === project.name;})) {
          chrome.bookmarks.create({'parentId': baseNode.id, 'title': project.name}, function(newProjectNode) {
            console.log("Added new folder for "+project.name);
            makeProjectBookmarks(project, newProjectNode);
          });
        }
      });
    });
  }

  my.makeAllBookmarks = function (projects) {
    chrome.bookmarks.getChildren(bookmarkBarId, function (nodes) {
      var found = false;
      $.each(nodes, function(i, node) {
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

  my.lookupProjectContent = function(projectName, callback) {
    my.scanTabsForProjects(function(projects) {
      chrome.bookmarks.getChildren(bookmarkBarId, function (nodes) {
        var baseNode = nodes.findObject(function(n) { return n.title === baseBookMarkName; });
        var project = projects.findObject(function(p) { return p.name === projectName; });
        if (project && baseNode) {
          chrome.bookmarks.getChildren(baseNode.id, function (nodes) {
            var projectNode = nodes.findObject(function(n) { return n.title === projectName; });
            chrome.bookmarks.getChildren(projectNode.id, function (nodes) {
              project.tabDescs.forEach(function(tabDesc) {
                tabDesc.bookmarked = nodes.findObject(function(n) { return n.url === tabDesc.url; }) !== null;
                tabDesc.active = true;
              });
              nodes.forEach(function(node) {
                if (!project.tabDescs.findObject(function(td) { return td.url === node.url; })) {
                  var newTabDesc = { title: node.title, url: node.url, favIconUrl: node.favIconUrl, bookmarked: true, active: false };
                  project.tabDescs.push(newTabDesc);
                }
              });
              callback(project);
            });
          });
        }
      });
    });
  };

  return my;
}());




