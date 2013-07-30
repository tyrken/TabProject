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
        'ichrome': ['js/ichrome']
    },
    shim: {
        /* Set bootstrap dependencies (just jQuery) */
        'bootstrap': ['jquery']
    }
});

require(['jquery', 'bootstrap', 'js/tabproject', 'js/utils', 'js/Project', 'js/Link'], function($, bootstrap, tp, utils, Project, Link) {
    "use strict";

    console.log("Loaded project via require");

    var project = null;
    var projects = [];
    var projectName = utils.getParameterByName(window.location.search, 'name');

    var draggedProject = null;
    var draggedLink = null;

    function displayProjectSettings() {
        $('#autosave').prop('checked', project.autosave);
        $('#autoopen').prop('checked', project.autoopen);
        $('#saveAll').prop('enabled', !project.autosave);
        document.title = project.name.escapeForHtml();
        $('#projectName').text(project.name);
        window.history.replaceState({}, project.name, project.url);
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

        var accordianHeader = element.closest('.accordion-group');
        if (accordianHeader.length) {
            clickedProjectName = $(accordianHeader).find('.accordion-toggle').text();
            targetProject = projects.findObject(function(p) {
                return p.name === clickedProjectName;
            });
            if (targetProject === null) {
                console.log('Could not find project', clickedProjectName);
            }
        }

        return targetProject;
    }

    function createProjectSubwindow(proj, anchor) {
        var link = findLinkInProject(proj, anchor);
        if (link) {
            chrome.tabs.create({
                    url: link.url,
                    windowId: proj.tabWindowId,
                    index: proj.tabIndex + 1,
                    openerTabId: proj.tabId,
                    active: false
                },
                function(tab) {
                    anchor.attr('class', 'active');
                    link.setFromTab(tab);
                });
        }

    }

    function displayProjects(allProjects) {
        projects = allProjects;
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
                    targetProject.setFromTab(tab);

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

            var dt = event.originalEvent.dataTransfer;
            dt.effectAllowed = 'move';
            dt.setData('text/html', anchor.href);
            console.log("In dragstart, moving", draggedLink);
        }).on('dragover', function(event) {
            event.preventDefault();
        }).on('drop', '.accordion-group, a', function(event) {
            event.preventDefault();
            var element = $(this);
            var targetProject = findContainingProject(element);
            var targetLink = null;
            var destFolderId = targetProject.bookmarkParentId;
            var destBookmarkIndex = 0;

            var anchor = element.closest('a');
            if (anchor.length && !anchor.first().attr('href').startsWith('#')) {
                targetLink = findLinkInProject(targetProject, anchor.first());
                destFolderId = targetLink.bookmarkParentId;
                destBookmarkIndex = targetLink.bookmarkIndex;
            }

            var tidyDraggedTab = function(node) {
                draggedLink.setFromBookmark(node);

                console.log("In tidyDraggedTab", draggedLink);

                if (draggedLink.tabId) {
                    if (targetProject.tabWindowId) {
                        chrome.tabs.move(draggedLink.tabId, {
                            windowId: targetProject.tabWindowId,
                            index: targetProject.tabIndex + 1
                        }, function(tab) {
                            draggedLink.setFromTab(tab);
                            refresh();
                        });
                    } else {
                        chrome.tabs.remove(draggedLink.tabId);
                        // TODO refactor to member func
                        draggedLink.active = false;
                        delete draggedLink.tabId;
                        delete draggedLink.tabIndex;
                        delete draggedLink.tabWindowId;
                        refresh();
                    }
                }

            };

            if (draggedLink.bookmarkId) {
                console.log("In drop, moving", draggedLink);
                chrome.bookmarks.move(draggedLink.bookmarkId, {
                    parentId: destFolderId,
                    index: destBookmarkIndex
                }, tidyDraggedTab);
            } else {
                console.log("In drop, creating", draggedLink);
                chrome.bookmarks.create({
                    parentId: destFolderId,
                    index: destBookmarkIndex,
                    title: draggedLink.title,
                    url: draggedLink.url
                }, tidyDraggedTab);
            }

        }).on('dragend', function(event) {
            console.log("In dragend", draggedLink);
            //draggedProject = draggedLink = null;
            // remove any border drop-highlights
        });

        displayProjectSettings(project);
    }

    function refresh() {
        // TODO: Remember state of accordian
        tp.getProjectsFromDBAndTabs(displayProjects);
    }

    function tabEventListener(tabId, info) {
        if (project !== null && tabId === project.tabId) {
            console.log("Refreshing due to move/attach", info);
            refresh();
        }
    }

    $(document).ready(function() {
        refresh();

        chrome.tabs.onActivated.addListener(function(info) {
            console.log("onActivated with", info);
            console.log("onActivated with project", project);
            if (project !== null && info.tabId === project.tabId && info.windowId === project.tabWindowId) {
                console.log("Refreshing due to activation", info);
                refresh();
            }
        });
        chrome.tabs.onAttached.addListener(tabEventListener);
        chrome.tabs.onMoved.addListener(tabEventListener);
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
            refresh();
            alert("Saved " + projectName);
        });
    });

    $('#close').on('click', function(event) {
        var unsaved = [];
        project.links.forEach(function(link) {
            if (link.active && !link.bookmarked) {
                unsaved.push(link);
            }
        });
        var answer = true;
        if (unsaved.length > 0) {
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
    });

});
