"use strict";

var ProjectPage = (function (TPM) {
  var my = {};

  my.init = function () {
    var name = getParameterByName(window.location.search, 'name');
    $('#projectName').text(name);
  };

  return my;
}(TPM));

document.addEventListener('DOMContentLoaded', function () {
  ProjectPage.init();
});

