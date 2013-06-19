var TPM = (function () {

  var my = {};
  
  function startsWith = function (input, prefix) {
    return input.slice(0, prefix.length) == prefix;
  };

  my.getMWOPH = function () {
    return chrome.bookmarks.MAX_WRITE_OPERATIONS_PER_HOUR;
  }

  my.getMSWOPM = function () {
    return chrome.bookmarks.MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE;
  }

  var baseBookMarkName= "TabProject";

  my.ProjectPageBase = 'chrome-extension://__MSG_@@extensionid/tabproject.html?name=';
  my.getProjectPageUrl = function (name) {
    return my.ProjectPageBase+encodeURIComponent(name);
  }
  my.isProjectPageUrl = function (url) {
    return startsWith(url, TPM.ProjectPageBase);
  }

  function getParameterByName(url, name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

  my.scanTabsForProjects = function () {
    var projects = [];
    console.log('Starting scanTabs');
    chrome.tabs.query({}, function (tabs) {
      var curProject = null;
      var length = arr.length,
          tab = null;
      for (var i = 0; i < length; i++) {
        tabs = tabs[i];
        if (tabs.index == 0) {
          curProject = null;
        }
        if (isProjectPageUrl(tabs.url)) {
          curProject = { name: getParameterByName(tabs.url, 'name'), tabDescs: [] };
          projects.push(curProject);
          console.log('FirstProjectTab', curProject);
        } else if (curProject != null) {
          var tabDesc = { title: tab.title, url: tab.url; favIconUrl: tab.favIconUrl };
          curProject.tabDescs.push(tabDesc);
          console.log('ProjectTab', tabDesc);
        }
      }      
    });
    console.log('Finished scanTabs');
    return projects;
  }

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
  alert("add");
    var name = $('newProjectName').text();
    if (isBlank(name)) {
      message("You must enter a Project Name first!");
      return;
    }
    var projectPageUrl = TPM.getProjectPageUrl(name);
    chrome.tabs.create({url:projectPageUrl});
  }

  my.init = function () {
  alert("init");

    // TODO enable button on name !blank
    $('#newProjectButton').click( function() {
      my.addNewProject();
    });

    var projects = TPM.scanTabsForProjects();
    var items = ['<ul>'];
    $.each(projects, function(i, project) {
      items.push('<li>'+project.name+'</li><ul>');
      $.each(project.tabDescs, function(j, tabDesc) {
        items.push('<li>'+tabDesc.title+'</li>');
      });
      items.push('</ul>');
    });  // close each()
    items.push('</ul>');
    $('#projectList').append( items.join('') );    
  }

  return my;
}(TPM));


document.addEventListener('DOMContentLoaded', function () {
  alert("ONO");
  if (TPM.isProjectPageUrl(window.location.search)) {

  } else {
    Popup.init();
  }
});
