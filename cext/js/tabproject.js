define(
  ["jquery", "utils", "ichrome"], function($, utils, ichrome) {
    "use strict";

    var bookmarkBarId = '1';
    var baseBookMarkName = "TabProject";

    var my = {};

    my.getMWOPH = function() {
      return ichrome.bookmarks.MAX_WRITE_OPERATIONS_PER_HOUR;
    };

    my.getMSWOPM = function() {
      return ichrome.bookmarks.MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE;
    };

    my.StopPageUrl = 'chrome-extension://' + ichrome.i18n.getMessage("@@extension_id") + '/stop.html';
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
              tabId: tab.id,
              tabIndex: tab.index,
              tabWindowId: tab.windowId,
              autosave: !! utils.getParameterByName(tab.url, 'as'),
              autoopen: !! utils.getParameterByName(tab.url, 'ao'),
              links: []
            };
            projects.push(curProject);
            console.log('FirstProjectTab', curProject);
          } else if (tab.url == my.StopPageUrl) {
            curProject = null;
          } else if (curProject !== null) {
            var link = {
              title: tab.title,
              url: tab.url,
              favIconUrl: tab.favIconUrl,
              tabId: tab.id,
              tabIndex: tab.index,
              tabWindowId: tab.windowId
            };
            curProject.links.push(link);
            console.log('ProjectTab', link);
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
                    project.autosave = !! utils.getParameterByName(n.url, 'as');
                    project.autoopen = !! utils.getParameterByName(n.url, 'ao');
                    nodes.splice(i, 1);
                    break;
                  }
                }
                project.storedBookmarks = nodes;
                project.links = [];
                nodes.forEach(function(node) {
                  if (!my.isProjectPageUrl(node.url) && !project.links.findObject(function(td) {
                    return td.url === node.url;
                  })) {
                    var newLink = {
                      title: node.title,
                      url: node.url,
                      favIconUrl: node.favIconUrl,
                      bookmarkId: node.id,
                      parentBookmarkId: node.parentId,
                      bookmarked: true,
                      active: false
                    };
                    project.links.push(newLink);
                  }
                });
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

    my.getProjectsFromDBAndTabs = function(callback) {
      my.listDBProjects(function(projects) {
        ichrome.tabs.query({}, function(tabs) {
          var nullProject = {
            name: "(Unallocated)",
            autosave: false,
            autoopen: false,
            links: []
          };
          var curProject = nullProject;
          projects.unshift(nullProject);
          tabs.forEach(function(tab) {
            console.log('TAB index=' + tab.index + ', title=' + tab.title);
            if (tab.index === 0) {
              curProject = nullProject;
            }
            if (my.isProjectPageUrl(tab.url)) {
              var projectName = utils.getParameterByName(tab.url, 'name');
              curProject = projects.findObject(function(p) {
                return p.name === projectName;
              });
              if (curProject === null) {
                curProject = {
                  name: projectName,
                  links: []
                };
                projects.push(curProject);
              }
              curProject.url = tab.url;
              curProject.tabId = tab.id;
              curProject.tabIndex = tab.index;
              curProject.tabWindowId = tab.windowId;
              curProject.autosave = !! utils.getParameterByName(tab.url, 'as');
              curProject.autoopen = !! utils.getParameterByName(tab.url, 'ao');

              console.log('FirstProjectTab', curProject);
            } else if (tab.url == my.StopPageUrl) {
              curProject = nullProject;
            } else {
              var link = curProject.links.findObject(function(l) {
                return l.url === tab.url;
              });
              if (link === null) {
                link = {
                  url: tab.url,
                  bookmarked: false
                };
                curProject.links.push(link);
              }
              link.title = tab.title;
              link.favIconUrl = tab.favIconUrl;
              link.tabId = tab.id;
              link.tabIndex = tab.index;
              link.tabWindowId = tab.windowId;
              link.active = true;
              console.log('Link entry', link);
            }
          });
          if (nullProject.links.length === 0) {
            projects.shift();
          }
          console.log('Finished getProjectsFromDBAndTabs', projects);
          callback(projects);
        });
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

    my.saveBookmark = function(project, url, title, callback) {
      ichrome.bookmarks.create({
        parentId: project.folderBookmarkId,
        title: title,
        url: url
      }, function(newProjectNode) {
        //console.log("Added new bookmark for " + link.title);
        callback(newProjectNode);
      });
    };

    function makeProjectBookmarks(project, projectParentNodeId, cdl) {
      console.log("Checking bookmarks for project " + project.name);
      ichrome.bookmarks.getChildren(projectParentNodeId, function(entries) {
        var projectUrl = my.getProjectPageUrl(project.name);
        cdl.reserve(project.links.length);
        if (!entries.findObject(function(entry) {
          return entry.url === projectUrl;
        })) {
          ichrome.bookmarks.create({
            'parentId': projectParentNodeId,
            'title': project.name,
            url: projectUrl
          }, function(newProjectNode) {
            console.log("Added new bookmark for project " + project.name);
            cdl.tick();
          });
        } else {
          console.log("Already have bookmark for project " + project.name);
          cdl.tick();
        }
        project.links.forEach(function(link) {
          var found = entries.findObject(function(entry) {
            return entry.url === link.url;
          });
          if (found) {
            cdl.tick();
          } else {
            ichrome.bookmarks.create({
              parentId: projectParentNodeId,
              title: link.title,
              url: link.url
            }, function(newProjectNode) {
              console.log("Added new bookmark for " + link.title);
              cdl.tick();
            });
          }
        });
      });
    }

    function makeProjectFolders(projects, baseNodeId, cdl) {
      ichrome.bookmarks.getChildren(baseNodeId, function(projectParentNodes) {
        cdl.tick();
        projects.forEach(function(project) {
          var projectParentNode = projectParentNodes.findObject(function(p) {
            return p.title === project.name;
          });
          if (projectParentNode !== null) {
            makeProjectBookmarks(project, projectParentNode.id, cdl);
          } else {
            ichrome.bookmarks.create({
              'parentId': baseNodeId,
              'title': project.name
            }, function(newProjectParentNode) {
              console.log("Added new folder for " + project.name);
              makeProjectBookmarks(project, newProjectParentNode.id, cdl);
            });
          }
        });
      });
    }

    my.makeBookmarks = function(projectName, callback) {
      my.scanTabsForProjects(function(projects) {

        if (typeof projectName !== 'undefined') {
          var project = projects.findObject(function(p) {
            return p.name === projectName;
          });
          if (!project) {
            if (callback) {
              callback();
            }
            return;
          }
          projects = [project];
        }

        var cdl = new utils.CountDownLatch(2 + projects.length, callback);

        ichrome.bookmarks.getChildren(bookmarkBarId, function(nodes) {
          var baseFolder = nodes.findObject(function(n) {
            return n.title === baseBookMarkName;
          });
          if (baseFolder) {
            makeProjectFolders(projects, baseFolder.id, cdl);
          } else {
            console.log("Adding base folder!");
            ichrome.bookmarks.create({
              'parentId': bookmarkBarId,
              'title': baseBookMarkName
            }, function(newBaseFolder) {
              makeProjectFolders(projects, newBaseFolder.id, cdl);
            });
          }
        });
        cdl.tick();
      });
    };

    my.makeAllBookmarks = function(callback) {
      my.makeBookmarks(undefined, callback);
    };

/*    my.lookupProjectContent = function(projectName, callback) {
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
                project.links.forEach(function(link) {
                  link.bookmarked = nodes.findObject(function(n) {
                    return n.url === link.url;
                  }) !== null;
                  link.active = true;
                });
                nodes.forEach(function(node) {
                  if (!my.isProjectPageUrl(node.url) && !project.links.findObject(function(td) {
                    return td.url === node.url;
                  })) {
                    var newlink = {
                      title: node.title,
                      url: node.url,
                      favIconUrl: node.favIconUrl,
                      bookmarkId: node.id,
                      parentBookmarkId: node.parentId,
                      bookmarked: true,
                      active: false
                    };
                    project.links.push(newlink);
                  }
                });
                callback(project);
              });
            });
          }
        });
      });
    };
*/
    return my;
  });