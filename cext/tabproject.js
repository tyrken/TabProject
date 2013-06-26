"use strict";

function getParameterByName(url, name) {
  var match = new RegExp('[?&#]' + name + '=([^&]*)').exec(url);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function setHashParameterByName(url, name, value) {
  if (value === null) {
    return url.replace('([&#])' + name + '=[^&]*&?', '$1').replace('[&#]$', '');
  }
  var newHashParam = name+'='+encodeURIComponent(value);
  var re = new RegExp('([&#])' + name + '=[^&]*');
  var match = re.exec(url);
  if (match) {
    return url.splice(match.index, re.lastIndex-match.index, match[1]+newHashParam);
  }
  return url+(url.indexOf('#') > 0 ? '&' : '#')+newHashParam;
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
      tabs.forEach(function(tab) {
        console.log('TAB index=' + tab.index + ', title=' + tab.title);
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

  my.enumerateProjectsFromDB = function (callback) {
    chrome.bookmarks.getChildren(bookmarkBarId, function (nodes) {
      var baseNode = nodes.findObject(function(n) { return n.title === baseBookMarkName; });
      if (baseNode !== null) {
        chrome.bookmarks.getChildren(baseNode.id, function (projectParentNodes) {
          var counter = projectParentNodes.length;
          projectParentNodes.forEach(function(projectParentNode) {
            var project = {};
            project.folderBookmarkId = projectParentNode.id;
            project.name = projectParentNode.title;
            chrome.bookmarks.getChildren(projectParentNode.id, function (nodes) {
              for (var i = 0, j = nodes.length; i < j; ++i) {
                var n = nodes[i];
                if (startsWith(n.url, my.ProjectPageBase)) {
                  project.bookmarkId = n.id;
                  project.url = n.url;
                  project.name = getParameterByName(n.url, 'name');
                  project.autosave = getParameterByName(n.url, 'as');
                  project.autoopen = getParameterByName(n.url, 'ao');
                  nodes.splice(i, 1);
                  break;
                }
              }
              project.storedBookmarks = nodes;
              return callback(project, --counter);
            });
          });
        });
      }
    });
  };
  
  my.listDBProjects = function (callback) {
    var projects = [];
    my.enumerateProjectsFromDB(function (project, remaining) {
      projects.push(project);
      if (remaining <= 0) {
        callback(projects);
      }
    });
  };

  my.getProjectFromDB = function (name, callback) {
    var found = false;
    my.enumerateProjectsFromDB(function (project, remaining) {
      if (project.name === name) {
        callback(project);
        found = true;
        return false;
      } else if (remaining <= 0 && !found) {
        callback(null);
      }
    });
  };

  my.updateProjectHashParamInDB = function (name, param, value, callback) {
    my.getProjectFromDB(name, function (project) {
      if (project === null) {
        alert('No project named "'+name+'"!');
        callback(null);
      } else {
        project.url = setHashParameterByName(project.url, param, value);
        chrome.bookmarks.update(project.bookmarkId, {'url': project.url}, function() {
          callback(project);
        });
      }
    });
  };

  function makeProjectBookmarks(project, projectParentNodeId) {
    console.log("Checking bookmarks for project "+project.name);
    chrome.bookmarks.getChildren(projectParentNodeId, function (entries) {
      var projectUrl = my.getProjectPageUrl(project.name);
      if (!entries.findObject(function(entry) { return entry.url === projectUrl; })) {
        chrome.bookmarks.create({'parentId': projectParentNodeId, 'title': project.name, url: projectUrl}, function(newProjectNode) {
          console.log("Added new bookmark for project "+project.name);
        });
      } else {
        console.log("Already have bookmark for project "+project.name);
      }
      project.tabDescs.forEach(function(tabDesc) {
        var found = entries.findObject(function(entry) { return entry.url === tabDesc.url });
        if (!found) {
          chrome.bookmarks.create({'parentId': projectParentNodeId, 'title': tabDesc.title, url: tabDesc.url}, function(newProjectNode) {
            console.log("Added new bookmark for "+tabDesc.title);
          });
        }
      });
    });
  }

  function makeProjectFolders(projects, baseNode) {
    chrome.bookmarks.getChildren(baseNode.id, function (projectParentNodes) {
      projects.forEach(function(project) {
        var projectParentNode = projectParentNodes.findObject(function(p){ return p.title === project.name;});
        if (projectParentNode != null) {
          makeProjectBookmarks(project, projectParentNode.id);
        } else {
          chrome.bookmarks.create({'parentId': baseNode.id, 'title': project.name}, function(newProjectParentNode) {
            console.log("Added new folder for "+project.name);
            makeProjectBookmarks(project, projectParentNode.id);
          });
        }
      });
    });
  }

  my.makeAllBookmarks = function (projects) {
    chrome.bookmarks.getChildren(bookmarkBarId, function (nodes) {
      var baseFolder = nodes.findObject(function(n){ return n.title === baseBookMarkName; });
      if (baseFolder) {
        makeProjectFolders(projects, baseFolder);
      } else {
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
            project.folderBookmarkId = projectNode.id;
            chrome.bookmarks.getChildren(projectNode.id, function (nodes) {
              project.tabDescs.forEach(function(tabDesc) {
                tabDesc.bookmarked = nodes.findObject(function(n) { return n.url === tabDesc.url; }) !== null;
                tabDesc.active = true;
              });
              nodes.forEach(function(node) {
                if (!project.tabDescs.findObject(function(td) { return td.url === node.url; })) {
                  var newTabDesc = { title: node.title, url: node.url, favIconUrl: node.favIconUrl, bookmarkId: node.id, parentBookmarkId: node.parentId, bookmarked: true, active: false };
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




