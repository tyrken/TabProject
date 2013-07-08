require(['jquery', 'bootstrap', 'tabproject', 'utils'], function($, bootstrap, TPM, utils) {
  "use strict";

  console.log("Loaded popup via require:)");

  var my = {};

  function updateGUI(project) {
    $('#autosave').prop('checked', project.autosave === '1');
    $('#autoopen').prop('checked', project.autoopen === '1');
    document.title = project.name;
    $('#projectName').text(project.name);
    window.history.replaceState({},project.name, project.url);
  }

  my.init = function () {
    var name = utils.getParameterByName(window.location.search, 'name');

    TPM.lookupProjectContent(name, function(project) {
      var items = [];
      project.tabDescs.forEach(function(tabDesc) {
        items.push('<li><a href="'+tabDesc.url+'">'+tabDesc.title+'</a>');
        if (tabDesc.bookmarked) items.push(' B ');
        if (tabDesc.active) items.push(' A ');
        items.push('</li>');
      });
      if (project.tabDescs.length === 0) {
        items.push('<li>No project content yet!</li>');
      }
      $('#projectContent').append( items.join('') );

      updateGUI(project);
    });

    $('input:checkbox').on('click', function(event) {
      var param = $(this).attr('id') === 'autosave' ? 'as' : 'ao';
      var newValue = $(this).is(':checked') ? null : '1';
      TPM.updateProjectHashParamInDB(name, param, newValue, function(project) {
        updateGUI(project);
      });
    });
  };

  $(my.init);

  return my;
}(TPM));

