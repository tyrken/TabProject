"use strict";

var ProjectPage = (function (TPM) {
  var my = {};

  my.init = function () {
    var name = getParameterByName(window.location.search, 'name');
    document.title = name;
    $('#projectName').text(name);

    TPM.lookupProjectContent(name, function(project) {
      var items = [];
      $.each(project.tabDescs, function(i, tabDesc) {
        items.push('<li><a href="'+tabDesc.url+'">'+tabDesc.title+'</a>');
        if (tabDesc.bookmarked) items.push(' B ');
        if (tabDesc.active) items.push(' A ');
        items.push('</li>');
      });
      if (project.tabDescs.length === 0) {
        items.push('<li>No project content yet!</li>');
      }
      $('#projectContent').append( items.join('') );
	});
  };

  return my;
}(TPM));

document.addEventListener('DOMContentLoaded', function () {
  ProjectPage.init();
});

