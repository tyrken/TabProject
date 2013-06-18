var TPM = (function () {

  var my = {};
  
  my.getMWOPH = function () {
    return chrome.bookmarks.MAX_WRITE_OPERATIONS_PER_HOUR;
  }

  my.getMSWOPM = function () {
    return chrome.bookmarks.MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE;
  }

  var baseBookMarkName= "TabProject";
  my.getProjects = function () {
    return ['Stuff', 'Other Stuff'];
  }

  return my;
}());

var Popup = (function (TPM) {
  var my = {};

  function isBlank(str) {
    return (!str || /^\s*$/.test(str));
  }

  my.addNewProject = function () {
    var name = $('newProjectName').text();
    if (isBlank(name)) {
      message("You must enter a Project Name first!");
      return;
    }
    var projectPageUrl = 'chrome-extension://__MSG_@@extensionid/tabproject.html?name='+encodeURIComponent(name);
    chrome.tabs.create({url:projectPageUrl});
  }

  my.init = function () {
    // TODO enable button on name !blank
    $('#newProjectButton').click( function() {
      my.addNewProject();
    });
  }

  return my;
}(TPM));


var Scanner = (function (TPM) {
  var my = {};

  my.scanForUpdates = function () {
    $("#mwoph").text(TPM.getMWOPH());
    $("#mswopm").text(TPM.getMSWOPM());
  }

  return my;
}(TPM));

// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
  Popup.init();
});
