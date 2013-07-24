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

    var project = null;
    var projectName = utils.getParameterByName(window.location.search, 'name');

    var draggedProject = null;
    var draggedLink = null;

    function displayProjectSettings(proj) {
        $('#autosave').prop('checked', proj.autosave);
        $('#autoopen').prop('checked', proj.autoopen);
        $('#saveAll').prop('enabled', !proj.autosave);
        document.title = proj.name.escapeForHtml();
        $('#projectName').text(proj.name);
        window.history.replaceState({}, proj.name, proj.url);
    }

    function findLinkInProject(proj, anchor) {
        var url = anchor.attr('href');
        var link = proj.links.findObject(function(l) {
            return l.url === url;
        });
        return link;
    }

    function findContainingProject(element) {
        var targetProject = project;
        var clickedProjectName = null;

        var accordianHeader = element.parents('.accordion-group');
        if (accordianHeader.length) {
            clickedProjectName = $(accordianHeader).find('.accordion-toggle').text();
        } else if (element.hasClass('accordion-group')) {
            clickedProjectName = element.find('.accordion-toggle').text();
        }

        if (clickedProjectName !== null) {
            targetProject = projects.findObject(function(p) {
                return p.name === clickedProjectName;
            });
            if (targetProject === null) {
                console.log('Could not find project', clickedProjectName);
            }
        }

        return targetProject;
    }

    function createProjectSubwindow(project, anchor) {
        var link = findLinkInProject(project, anchor);
        if (link) {
            chrome.tabs.create({
                    url: link.url,
                    windowId: project.tabWindowId,
                    index: project.tabIndex + 1,
                    openerTabId: project.tabId,
                    active: false
                },
                function(tab) {
                    anchor.attr('class', 'active');
                    link.active = true;
                    link.tabId = tab.id;
                    link.tabIndex = tab.index;
                    link.tabWindowId = tab.windowId;
                });
        }

    }

    function displayProjects(projects) {
        project = projects.findObject(function(p) {
            return p.name === projectName;
        });

        // TODO: Learn mustache!
        var newHtml = ['<div class="row-fluid"><div class="span6"><ul class="projectContent clearfix">'];

        function appendLinkHTML(link) {
            var iconClass = link.bookmarked ? 'icon-star' : 'icon-star-empty';
            var activityClass = link.active ? 'active' : 'inactive';
            newHtml.push('<li><i class="' + iconClass + '"></i> <a href="' + link.url + '" class="' + activityClass + '">' + link.title.escapeForHtml() + '</a></li>');
        }
        project.links.forEach(appendLinkHTML);
        if (project.links.length === 0) {
            newHtml.push('<li>No project content yet!</li>');
        }
        newHtml.push('</ul></div><div class="span6"><div class="accordion" id="otherProjects">');

        for (var i = 0; i < projects.length; i++) {
            if (projects[i] !== project) {
                var localLink = "collapse" + i;
                newHtml.push('<div class="accordion-group"><div class="accordion-heading"><a class="accordion-toggle" data-toggle="collapse" data-parent="#otherProjects" href="#' + localLink + '">' + projects[i].name.escapeForHtml() + '</a></div><div id="' + localLink + '" class="accordion-body collapse"><div class="accordion-inner"><ul class="projectContent clearfix">');
                projects[i].links.forEach(appendLinkHTML);
                newHtml.push('</ul></div></div></div>');
            }
        }
        newHtml.push('</div></div></div>');
        $('#projectContent').html(newHtml.join(''));

        $('i[class="icon-star-empty"]').on('click', function(event) {
            var icon = $(this);
            var link = icon.next();
            //console.log('icon-click', link);
            tp.saveBookmark(project, link.attr('href'), link.text(), function(node) {
                icon.attr('class', 'icon-star');
            });
        });

        // TODO: Consider binding to upper element with filtering?
        //        $('a[class="inactive"]').on('click', function(event) {
        $('#projectContent').on('click', 'a .inactive', function(event) {
            event.preventDefault();

            var anchor = $(this);
            /*            if (!anchor.hasClass('inactive')) {
                return;
            } */
            var targetProject = findContainingProject(anchor);

            if (!targetProject.tabId) {
                chrome.tabs.create({
                    url: targetProject.url,
                    index: 999,
                    active: false
                }, function(tab) {
                    targetProject.tabId = tab.id;
                    targetProject.tabWindowId = tab.windowId;
                    targetProject.tabIndex = tab.index;

                    createProjectSubwindow(targetProject, anchor);
                });
            } else {
                createProjectSubwindow(targetProject, anchor);
            }
        })

        //        $('a').on('dblclick', function(event) {
        .on('dblclick', 'a', function(event) {
            var anchor = $(this);
            var targetProject = findContainingProject(anchor);
            var link = findLinkInProject(targetProject, anchor);
            if (link.tabId) {
                chrome.tabs.update(link.tabId, {
                    active: true
                });
            }
        }).on('dragstart', 'a', function(event) {
            var anchor = $(this);
            draggedProject = findContainingProject(anchor);
            draggedLink = findLinkInProject(draggedProject, anchor);

            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/html', anchor.href);
        }).on('dragover', function(event) {
            event.preventDefault();
        }).on('drop', '.accordion-group, a', function(event) {
            event.preventDefault();
            var element = $(this);
            var targetProject = findContainingProject(element);
            var link = null;
            var destFolderId = targetProject.folderBookmarkId;
            var destBookmarkIndex = 0;
            if (!element.hasClass('accordion-group')) {
                link = findLinkInProject(targetProject, element);
                destFolderId = link.bookmarkParentId;
                destBookmarkIndex = link.bookmarkIndex;
            }

            var tidyDraggedTab = function(node) {
                draggedLink.bookmarkId = node.id;
                draggedLink.bookmarkIndex = node.index;
                draggedLink.bookmarkParentId = node.parentId;
                draggedLink.bookmarked = true;

                if (draggedLink.tabId) {
                    if (targetProject.tabWindowId) {
                        chrome.tabs.move(draggedLink.tabId, {
                            windowId: targetProject.tabWindowId,
                            index: targetProject.tabIndex + 1
                        }, function(tab) {
                            draggedLink.tabId = tab.id;
                            draggedLink.tabIndex = tab.index;
                            draggedLink.tabWindowId = tab.windowId;
                        });
                    } else {
                        chrome.tabs.remove(draggedLink.tabId);
                        draggedLink.active = false;
                        delete draggedLink.tabId;
                        delete draggedLink.tabIndex;
                        delete draggedLink.tabWindowId;
                    }
                }

                draggedProject = draggedLink = null;
            };

            if (draggedLink.bookmarkId) {
                chrome.bookmarks.move(draggedLink.bookmarkId, {
                    parentId: destFolderId,
                    index: destBookmarkIndex
                }, tidyDraggedTab);
            } else {
                chrome.bookmarks.create({
                    parentId: destFolderId,
                    index: destBookmarkIndex,
                    title: link.title,
                    url: link.url
                }, tidyDraggedTab);
            }

        }).on('dragend', function(event) {
            draggedProject = draggedLink = null;
            // remove any border drop-highlights
        });

        displayProjectSettings(project);
    }

    function refresh() {
        // TODO: Remember state of accordian
        tp.getProjectsFromDBAndTabs(displayProjects);
    }

    $(document).ready(function() {
        refresh();

        chrome.tabs.onActivated.addListener(function(info) {
            console.log("onActivated with", info);
            console.log("onActivated with project", project);
            if (project !== null && info.tabId === project.tabId && info.windowId === project.tabWindowId) {
                console.log("Refreshing due to", info);
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