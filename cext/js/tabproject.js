define(
["jquery", "utils", "ichrome"], function($, utils, ichrome) {
  "use strict";

  var bookmarkBarId = '1';
  var baseBookMarkName = "TabProject";

  function makeProjectBookmarks(project, projectParentNodeId) {
    console.log("Checking bookmarks for project " + project.name);
    ichrome.bookmarks.getChildren(projectParentNodeId, function(entries) {
      var projectUrl = my.getProjectPageUrl(project.name);
      if (!entries.findObject(function(entry) {
        return entry.url === projectUrl;
      })) {
        ichrome.bookmarks.create({
          'parentId': projectParentNodeId,
          'title': project.name,
          url: projectUrl
        }, function(newProjectNode) {
          console.log("Added new bookmark for project " + project.name);
        });
      } else {
        console.log("Already have bookmark for project " + project.name);
      }
      project.tabDescs.forEach(function(tabDesc) {
        var found = entries.findObject(function(entry) {
          return entry.url === tabDesc.url;
        });
        if (!found) {
          ichrome.bookmarks.create({
            'parentId': projectParentNodeId,
            'title': tabDesc.title,
            url: tabDesc.url
          }, function(newProjectNode) {
            console.log("Added new bookmark for " + tabDesc.title);
          });
        }
      });
    });
  }

  function makeProjectFolders(projects, baseNodeId) {
    ichrome.bookmarks.getChildren(baseNodeId, function(projectParentNodes) {
      projects.forEach(function(project) {
        var projectParentNode = projectParentNodes.findObject(function(p) {
          return p.title === project.name;
        });
        if (projectParentNode !== null) {
          makeProjectBookmarks(project, projectParentNode.id);
        } else {
          ichrome.bookmarks.create({
            'parentId': baseNodeId,
            'title': project.name
          }, function(newProjectParentNode) {
            console.log("Added new folder for " + project.name);
            makeProjectBookmarks(project, newProjectParentNode.id);
          });
        }
      });
    });
  }

  var my = {};

  my.getMWOPH = function() {
    return ichrome.bookmarks.MAX_WRITE_OPERATIONS_PER_HOUR;
  };

  my.getMSWOPM = function() {
    return ichrome.bookmarks.MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE;
  };

  my.ProjectPageBase = 'chrome-extension://' + ichrome.i18n.getMessage("@@extension_id") + '/project.html?name=';

  my.getProjectPageUrl = function(name) {
    return my.ProjectPageBase + encodeURIComponent(name);
  };

  my.isProjectPageUrl = function(url) {
    return utils.startsWith(url, my.ProjectPageBase);
  };

  my.scanTabsForProjects = function(callback) {
    console.log('Starting scanTabs');
    ichrome.tabs.query({}, function(tabs) {
      var projects = [];
      var curProject = null;
      tabs.forEach(function(tab) {
        console.log('TAB index=' + tab.index + ', title=' + tab.title);
        if (tab.index === 0) {
          curProject = null;
        }
        if (my.isProjectPageUrl(tab.url)) {
          curProject = {
            name: utils.getParameterByName(tab.url, 'name'),
            url: tab.url,
            autosave: !!utils.getParameterByName(tab.url, 'as'),
            autoopen: !!utils.getParameterByName(tab.url, 'ao'),
            tabDescs: []
          };
          projects.push(curProject);
          console.log('FirstProjectTab', curProject);
        } else if (curProject !== null) {
          var tabDesc = {
            title: tab.title,
            url: tab.url,
            favIconUrl: tab.favIconUrl
          };
          curProject.tabDescs.push(tabDesc);
          console.log('ProjectTab', tabDesc);
        }
      });
      console.log('Finished scanTabs', projects);
      callback(projects);
    });
  };

  my.enumerateProjectsFromDB = function(callback) {
    ichrome.bookmarks.getChildren(bookmarkBarId, function(nodes) {
      var baseNode = nodes.findObject(function(n) {
        return n.title === baseBookMarkName;
      });
      if (baseNode !== null) {
        ichrome.bookmarks.getChildren(baseNode.id, function(projectParentNodes) {
          var counter = projectParentNodes.length;
          projectParentNodes.forEach(function(projectParentNode) {
            var project = {};
            project.folderBookmarkId = projectParentNode.id;
            project.name = projectParentNode.title;
            ichrome.bookmarks.getChildren(projectParentNode.id, function(nodes) {
              for (var i = 0, j = nodes.length; i < j; ++i) {
                var n = nodes[i];
                if (my.isProjectPageUrl(n.url)) {
                  project.bookmarkId = n.id;
                  project.url = n.url;
                  project.name = utils.getParameterByName(n.url, 'name');
                  project.autosave = !!utils.getParameterByName(n.url, 'as');
                  project.autoopen = !!utils.getParameterByName(n.url, 'ao');
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

  my.listDBProjects = function(callback) {
    var projects = [];
    my.enumerateProjectsFromDB(function(project, remaining) {
      projects.push(project);
      if (remaining <= 0) {
        callback(projects);
      }
    });
  };

  my.getProjectFromDB = function(name, callback) {
    var found = false;
    my.enumerateProjectsFromDB(function(project, remaining) {
      if (project.name === name) {
        callback(project);
        found = true;
        return false;
      } else if (remaining <= 0 && !found) {
        callback(null);
      }
    });
  };

  my.updateProjectHashParamInDB = function(name, param, value, callback) {
    my.getProjectFromDB(name, function(project) {
      if (project === null) {
        alert('No project named "' + name + '"!');
        callback(null);
      } else {
        project.url = utils.setHashParameterByName(project.url, param, value ? '1' : null);
        ichrome.bookmarks.update(project.bookmarkId, {
          'url': project.url
        }, function() {
          callback(project);
        });
      }
    });
  };

  my.makeAllBookmarks = function(projects) {
    ichrome.bookmarks.getChildren(bookmarkBarId, function(nodes) {
      var baseFolder = nodes.findObject(function(n) {
        return n.title === baseBookMarkName;
      });
      if (baseFolder) {
        makeProjectFolders(projects, baseFolder.id);
      } else {
        console.log("Adding base folder!");
        ichrome.bookmarks.create({
          'parentId': bookmarkBarId,
          'title': baseBookMarkName
        }, function(newFolder) {
          makeProjectFolders(projects, newFolder.id);
        });
      }
    });
  };

  my.lookupProjectContent = function(projectName, callback) {
    my.scanTabsForProjects(function(projects) {
      ichrome.bookmarks.getChildren(bookmarkBarId, function(nodes) {
        var baseNode = nodes.findObject(function(n) {
          return n.title === baseBookMarkName;
        });
        var project = projects.findObject(function(p) {
          return p.name === projectName;
        });
        if (project && baseNode) {
          ichrome.bookmarks.getChildren(baseNode.id, function(nodes) {
            var projectNode = nodes.findObject(function(n) {
              return n.title === projectName;
            });
            project.folderBookmarkId = projectNode.id;
            ichrome.bookmarks.getChildren(projectNode.id, function(nodes) {
              project.tabDescs.forEach(function(tabDesc) {
                tabDesc.bookmarked = nodes.findObject(function(n) {
                  return n.url === tabDesc.url;
                }) !== null;
                tabDesc.active = true;
              });
              nodes.forEach(function(node) {
                if (!my.isProjectPageUrl(node.url) && !project.tabDescs.findObject(function(td) {
                  return td.url === node.url;
                })) {
                  var newTabDesc = {
                    title: node.title,
                    url: node.url,
                    favIconUrl: node.favIconUrl,
                    bookmarkId: node.id,
                    parentBookmarkId: node.parentId,
                    bookmarked: true,
                    active: false
                  };
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
});