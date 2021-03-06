$(document).ready(function () {
  // TODO - delegate events
  if (mode === 'view') {
    $('.ui.form .input').addClass('transparent');
    showTestSetCards();
    $('#systemId').popup();
  } else {
    // Set language dropdowns content
    wrapSetDropdownContent();
    $('label').popup({
      hoverable: true
    });
  }

  // Click to copy
  click2copy('systemId');

  // Enable dropdown
  $('.ui.dropdown').dropdown();
  $('.ui.toggle.checkbox').checkbox({
    onChange: function () {
      var state = $(this).prop('checked') ? 'Yes' : 'No'; // i18n
      $(this).next('label').text(state);
      $('.trainSet').transition({
        animation: 'slide down',
        duration: '0.5s'
      });
      if (state === 'No') {
        $('.trainSet').addClass('required');
      } else {
        $('.trainSet').removeClass('required');
      }
    }
  });

  // Enable/disable submit button
  $('#translationSystem .field.required, input[name=trainSet], input[name=constraint]').on('input change', function (e) {
    var filled = $('#translationSystem .field.required').map(function (i, el) {
      if ($(el).find('input').attr('name')) {
        return !!$(this).find('input').val().trim();
      } else {
        return !!$(this).find('select').val().length;
      }
    }).toArray()
    .reduce(function (a, b) {
      return a && b;
    }, true);

    var either = $('input[name=constraint]').prop('checked') || $('input[name=trainSet]').val().trim();

    var prefix = $('input[name=systemName]').val().trim().match(/^[^:]+:[^:]/);

    if (filled && prefix && either) {
      $('#createSystem').removeClass('disabled');
      $('#createSystem').addClass('basic fireBrick');
    } else {
      $('#createSystem').addClass('disabled');
      $('#createSystem').removeClass('basic fireBrick');
    }
  });

  // Controls
  $('#createSystem').on('click', function () {
    var params = getDescription();
    var url = params.system_id ? '/translationSystem/update' : '/translationSystem/create';
    $.post(url, params)
    .done(function (response) {
      try {
        response = JSON.parse(response);
      } catch (e) {
        console.log('Unable to parse server response, should be a JSON object already');
      }
      if (response.error) {
        var level = 'error';
        if (response.error.errors) {
          var text = '';
          for (var field in response.error.errors) {
            if (response.error.errors.hasOwnProperty(field)) {
              text += response.error.errors[field].message;
            }
          }
          flash(level, text);
        } else {
          flash(level, response.error);
        }
      } else {
        window.location = '/translationSystem/view/' + response.data._id;
      }
    })
    .fail(function (err) {
      flash('error', err);
      console.log(err, err.stack);
    });
  });
  if (mode === 'view') {
    $('#deleteSystem').on('click', function () {
      var deleteSystem = {
        url: '/translationSystem/delete/' + translationSystem._id,
        done: function () {
          window.location = '/';
        },
        header: 'Are you sure you want to delete this system?', // i18n
        content: 'All associated translations and scores will be lost', // i18n
        $target: $(this)
      };
      confirm(deleteSystem);
    });
  }
  $('#createSystem, #deleteSystem').on('keypress', function (e) {
    if (e.which === 13 || e.which === 32) {
      e.preventDefault();
      $(e.target).trigger('click');
    }
  });

  // Confirmation modal
  $('.cancel.button, .ok.button').on('keypress', function (e) {
    if (e.which === 13 || e.which === 32) {
      e.preventDefault();
      $(e.target).trigger('click');
    }
  });
});

function setEventListeners () {
  // TODO - delegate
  // Download source
  $('.getSource').on('click', function () {
    var fileId = $(this).attr('data-fileId');
    var downloadPage = window.open('/download/test/' + fileId);
  });

  // Remove output
  $('.deleteOutput').on('click', function () {
    var deleteOutput = {
      url: '/testOutput/delete/' + $(this).attr('data-testOutputId'),
      done: function () {
        location.reload();
      },
      header: 'Are you sure you want to delete this translation?', // i18n
      content: 'All associated scores will be lost', // i18n
      $target: $(this)
    };
    confirm(deleteOutput);
  });

  // Upload output
  $('.uploadOutput').on('click', function () {
    $(this).removeClass('icon');
    $(this).addClass('loading');
    $(this).closest('form').submit();
  });

  // Add key event
  $('.deleteOutput, .getSource, .selectOutput, .uploadOutput').on('keypress', function (e) {
    if (e.which === 13 || e.which === 32) {
      e.preventDefault();
      $(e.target).trigger('click');
    }
  });
}

function getDescription () {
  var description = {};
  $('.ui.form input, .ui.form textarea, .ui.form select').each(function (i, input) {
    if ($(input).attr('name') === 'constraint') {
      description[$(input).attr('name')] = $(input).is(':checked');
    } else {
      description[$(input).attr('name')] = $(input).val();
    }
  });
  return description;
}

function confirm (config) {
  $('.ui.modal').modal({
    blurring: true,
    onApprove: function () {
      $.get(config.url)
      .done(function (response) {
        try {
          response = JSON.parse(response);
        } catch (e) {
          console.log('Unable to parse server response, should be a JSON object already');
        }
        if (response.error) {
          var level = 'error';
          if (response.error.errors) {
            var text = '';
            for (var field in response.error.errors) {
              if (response.error.errors.hasOwnProperty(field)) {
                text += response.error.errors[field].message;
              }
            }
            flash(level, text);
          } else {
            flash(level, response.error);
          }
        } else {
          config.done();
        }
      })
      .fail(function (err) {
        var level = 'error';
        flash(level, err);
        console.log(err.trace);
      });
    },
    onShow: function () {
      $('#dialogHeader').text(config.header);
      $('#dialogDescription').text(config.content);
    },
    onVisible: function () {
      $('.ui.modal').find('.cancel.button').focus();
    },
    onHidden: function () {
      $(config.$target).focus();
    }
  }).modal('show');
}

function wrapSetDropdownContent () { // TODO - active item
  setDropdownContent({
    $target: $('select[name=sourceLanguage]'),
    column: 'src'
  });
  setDropdownContent({
    $target: $('select[name=targetLanguage]'),
    column: 'tgt'
  });
}

function setDropdownContent (config) {
  $.get('/getLanguagePairs')
  .done(function (response) {
    var tmp = {};
    var html = response.data.map(function (lp) {
      return lp[config.column];
    }).filter(function (lang) {
      if (!tmp.hasOwnProperty(lang)) {
        tmp[lang] = 1;
        return true;
      }
    }).sort(function (a, b) {
      return c2l[a] < c2l[b] ? -1 : 1;
    }).map(function (lang) {
      var buf = [];
      buf.push('<option value="' + lang + '">' + c2l[lang] + '</option>');
      return buf.join('');
    });
    config.$target.html(html);
  })
  .fail(function (error) {
    flash('error', error);
    console.log(error);
  });
}

function getTestSets () {
  return new Promise(function (resolve, reject) {
    $.get('/getTestSets?src=' + src + '&tgt=' + tgt)
    .done(function (response) {
      resolve(response.data);
    })
    .fail(function (error) {
      reject(error);
    });
  });
}

function getTranslationOutputs (systemId) {
  return new Promise(function (resolve, reject) {
    $.get('/getTranslationOutputs?systemId=' + systemId)
    .done(function (response) {
      resolve(response.data);
    })
    .fail(function (error) {
      reject(error);
    });
  });
}

function showTestSetCards () {
  if (isAuthor) {
    var testSets;
    getTestSets()
    .then(function (ts) {
      testSets = ts;
      return getTranslationOutputs(systemId);
    })
    .then(function (to) {
      var html = testSets.map(function (testSet) {
        var testOutput = to.filter(function (output) {
          return testSet._id === output.fileId;
        })[0];
        return testSetTemplate(testSet, testOutput);
      }).join('');
      $('.last.row .ui.cards').html(html);
      customizeFileOutput();
      setEventListeners();
    })
    .catch(function (error) {
      console.log(error);
      flash('error', error);
    });
  }
}

function testSetTemplate (testSet, testOutput) {
  var buf = [];
  buf.push('<div class="ui raised fluid card" style="width: 450px;">');
    buf.push('<div class="content">');

      // File name
      buf.push('<div class="header" style="display: flex; justify-content: space-between; align-items: center">');
      buf.push(testSet.source.fileName);
      buf.push('</div>');

      // File description
      buf.push('<div class="description">');
        buf.push('<ul>');
          buf.push('<li>Domain: ' + testSet.domain + '</li>');
          buf.push('<li>Origin: ' + testSet.origin + '</li>');
          // Output file info
          if (testOutput) {
            buf.push('<li>File: ' + testSet.fileName);
            if (isAuthor) { // Delete translation button
              buf.push('<i class="trash icon fireBrick deleteOutput" data-testOutputId="' + testOutput._id + '" role="button" tabindex="0" aria-label="Delete translation output"></i>');
            }
            buf.push('</li>');
            buf.push('<li>Date: ' + new Date(testOutput.date).toLocaleDateString() + '</li>');
            if (testOutput.scores) {
              buf.push('<li>Score: ' + testOutput.scores.BLEU + '</li>');
            }
          }
        buf.push('</ul>');

        // Get source button
        buf.push('<div class="getSource ui basic fireBrick button" data-fileId="' + testSet._id + '" role="button" tabindex="0" aria-label="Download source file">');
        buf.push('<i class="download icon"></i>');
        buf.push('Get source');
        buf.push('</div>');

      buf.push('</div>');
    buf.push('</div>');

    // Upload form
    if (!testOutput && isAuthor) {
      buf.push('<div class="extra content">');
        buf.push('<div class="header" style="margin-bottom: 10px; margin-top: 5px;">');
        buf.push('Translation');
        buf.push('</div>');
        buf.push('<form action="/testOutput/upload" enctype="multipart/form-data" method="post">');
          buf.push('<div class="selectOutput ui icon input" data-fileId="' + testSet._id + '">');
            buf.push('<input class="fileName" />');
            buf.push('<i class="folder open icon"></i>');
          buf.push('</div>');
          buf.push('<div class="uploadOutput ui icon disabled button" data-fileId="' + testSet._id + '" role="button" tabindex="0" aria-label="Upload translation output">');
            buf.push('<i class="upload icon"></i>');
            buf.push('Upload');
          buf.push('</div>');
          buf.push('<input type="file" name="file" style="display: none;" data-fileId="' + testSet._id + '" />');
          buf.push('<input type="hidden" name="fileId" value="' + testSet._id + '" />');
          buf.push('<input type="hidden" name="systemId" value="' + systemId + '" />');
        buf.push('</form>');
      buf.push('</div>');
    }

  buf.push('</div>');
  return buf.join('');
}

function customizeFileOutput () {
  $(document).on('change', ':file[name=file]', function () {
    var $input = $(this);
    var fileName = $input.val().replace(/\\/g, '/').replace(/.*\//, '');
    var $form = $(this).closest('form');
    $input.trigger('fileselect', [fileName, $form]);
  });
  $(':file[name=file]').on('fileselect', function (e, fileName, $form) {
    var $selectOutput = $form.find('.selectOutput');
    var $uploadOutput = $form.find('.uploadOutput');
    $selectOutput.find('input').val(fileName);
    if (fileName) {
      $uploadOutput.removeClass('disabled');
      $uploadOutput.addClass('basic fireBrick');
    } else {
      $uploadOutput.removeClass('basic fireBrick');
      $uploadOutput.addClass('disabled');
    }
  });
  $('.selectOutput').on('click', function () {
    var fileId = $(this).attr('data-fileId');
    $(':file[data-fileId="' + fileId + '"]').trigger('click');
  });
  $('.fileName').on('focus', function () {
    $(this).blur();
  });
}
