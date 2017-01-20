$(document).ready(function () {
  // enable dropdowns
  $('.ui.dropdown').dropdown();

  // Language pair selection handler
  $('#languagePairs').dropdown({
    onChange: function (value, text) {
      if (!value) {
        $('#languagePairs').dropdown('restore defaults');
      }
      getTable(value);
    }
  });

  getTable();
});

function getTable (languagePair) {
  $('#testSetTable').dataTable({
    destroy: true,
    searching: false,
    info: false,
    stateSave: true,
    paging: false,
    data: filterByLp(testSets, languagePair),
    order: [0, 'asc'],
    columns: [
      {data: 'languagePair', sWidth: '130', render: function (data, type, full) {
        return [c2l[full.source.language], c2l[full.target.language]].join(' - ');
      }},
      {data: 'domain'},
      {data: 'source.fileName', sWidth: '130'},
      {data: 'download', sortable: false, sDefaultContent: '', render: function (data, type, full) {
        return '<div class="downloadSrc circular ui basic icon button" data-fileId="' + full._id + '"><i class="download icon"></i></div>'
      }}
    ],
    drawCallback: function (settings) {
      $('#testSetTable').on('click', function (e) {
        var target;
        if (e.target.nodeName === 'I') {
          target = $(e.target).closest('div');
        } else if (e.target.nodeName === 'DIV') {
          target = $(e.target);
        }
        if (target && $(target).attr('data-fileId')) {
          var downloadPage = window.open('/download/' + $(target).attr('data-fileId'));
        }
      });
    }
  });
}

function filterByLp (list, languagePair) {
  if (languagePair) {
    var src = languagePair.substring(0,2);
    var tgt = languagePair.substring(2);
    return list.filter(function (item) {
      return item.source.language === src && item.target.language === tgt;
    });
  } else {
    return list;
  }
}
