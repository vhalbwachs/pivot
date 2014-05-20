var app = {};

app.data = undefined;
app.dataColumnTypes = {};
app.selectedColumns = [];

app.CSVToArray = function (strData, strDelimiter) {
  strDelimiter = (strDelimiter || ",");
  var objPattern = new RegExp(
    ("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
     "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
     "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");

  var arrData = [[]];
  var arrMatches = null;

  while (arrMatches = objPattern.exec(strData)) {
    var strMatchedDelimiter = arrMatches[1];
    if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
      arrData.push([]);
    }
    if (arrMatches[2]) {
      var strMatchedValue = arrMatches[2].replace(new RegExp( "\"\"", "g" ),"\"");
    } else {
      var strMatchedValue = arrMatches[3];
    }
    arrData[arrData.length - 1].push(strMatchedValue);
  }
  return(arrData);
}

app.drawAvailableColHeaders = function(columnHeaders) {
  var $availColHeadersList = $('#data-columns');
  _.each(columnHeaders, function(columnHeader, i) {
    var col = $('<li />').text(columnHeader)
                         .addClass('list-group-item')
                         .attr('data-colIndex', i)
                         .on('click', function() {
                           app.addColumn(i);
                           col.detach();
                         });
    $availColHeadersList.append(col);
  });
}


app.rowSummarizer = function() {
  var result = [];
  var summaryMap = {};
  var attributeCols = _.filter(this.selectedColumns, function(colIndex) {
    return app.dataColumnTypes[colIndex] === 'attribute'
  });
  var summaryCols = _.filter(this.selectedColumns, function(colIndex) {
    return app.dataColumnTypes[colIndex] === 'summarizable';
  });

  var returnedColOrder = _.union(attributeCols, summaryCols);

  //empty object to store the map of the sums of all summarizable columns
  var makeSumMap = function() {
    var sumColNewObj = {};
    // {2:0, 4:0}
    _.each(summaryCols, function(colIndex) {
      sumColNewObj[colIndex] = 0;
    })
    return sumColNewObj;
  }

  _.each(this.data, function(row, index) {
    // only run if not the header row
    if (index) {
      var rowIdentifier = '';
      //go through the columns which are attribute columns and build the row identifiers
      _.each(attributeCols, function(val, i, collection) {
        if (collection.length === 1 || i === collection.length-1) {
          rowIdentifier += row[val];
        } else {
          rowIdentifier += row[val] + ":::";
        }
      });
      // rowidentifier = NY:::Upgrade
      if(!summaryMap[rowIdentifier]) {
        summaryMap[rowIdentifier] = makeSumMap();
      }
      _.each(summaryCols, function(col) {
        summaryMap[rowIdentifier][col] += +row[col];
      });
    }
  });
  _.each(summaryMap, function(summarizedTotal, rowIdentifier) {
    var row = rowIdentifier.split(":::");
    _.each(summaryMap[rowIdentifier], function(total, colIndex) {
      row.push(total);
    })
    result.push(row);
  });
  this.drawTable(result, returnedColOrder);
}

app.drawTable = function (tableArray, returnedColOrder) {
  var $tbody = $('tbody').empty();
  var $thead = $('.colHeaders').empty();
  _.each(returnedColOrder, function(header) {
    $('<th />').text(app.data[0][header])
               .appendTo($thead);
  })
  _.each(tableArray, function(row) {
    var $row = $('<tr />');
    _.each(row, function(cell) {
      $('<td />').text(cell)
                 .appendTo($row);
    });
    $row.appendTo($('tbody'));
  });
}

app.addColumn = function(colIndex) {
  this.selectedColumns.push(colIndex);
  this.rowSummarizer();
}

app.postDataLoadProcess = function() {
  var typeCheckRow = this.data[1];
  _.each(typeCheckRow, function(cell, index) {
    if (isNaN(+cell)) {
     app.dataColumnTypes[index] = 'attribute'
    } else {
     app.dataColumnTypes[index] = 'summarizable'
    }
  });
  var headers = this.data[0];
  this.drawAvailableColHeaders(headers);
}

app.init = function(){
  $(function(){
    $('#process').on('click', function() {
      var file = $('#file-upload').get(0).files[0];
      var reader = new FileReader();
      reader.onloadend = function(){
        app.data = app.CSVToArray(reader.result, ',');
        app.postDataLoadProcess();
      }
      reader.readAsText(file);
    });
  });
}

app.init();