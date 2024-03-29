var app = {};

app.data = undefined;
app.dataColumnTypes = {};
app.selectedColumns = [];
app.rowFilter = {};

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

app.drawAvailableColHeaders = function() {
  var headers = _.range(this.data[0].length);
  var availCols = _.difference(headers, this.selectedColumns)
  console.log(availCols);
  var $availColHeadersList = $('#data-columns').empty();
  _.each(availCols, function(columnHeader, i) {
    var col = $('<a />').text(app.data[0][columnHeader])
                         .addClass('list-group-item')
                         .attr('data-colIndex', columnHeader)
                         .on('click', function() {
                           app.addColumn(columnHeader);
                           col.hide();
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
  var numberWithCommas = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  this.drawAvailableColHeaders();
  var $tbody = $('tbody').empty();
  var $thead = $('.colHeaders').empty();
  _.each(returnedColOrder, function(header) {
    $('<th />').text(app.data[0][header])
               .attr('data-colIndex', header)
               .appendTo($thead)
               .on('click', function() {
                 app.removeCol($(this).attr('data-colIndex'));  
               })
  })
  _.each(tableArray, function(row) {
    var $row = $('<tr />');
    _.each(row, function(cell) {
      $('<td />').text(numberWithCommas(cell))
                 .appendTo($row);
    });
    $row.appendTo($('tbody'));
  });
  $('tr').on('click', function() {
    app.rowFilter = {};
    $('.info').removeClass('info');
    if(!$(this).parent().first().is('thead')){  
      $(this).addClass('info');
    }
    $(this).children().each(function(a,b){
      var cellVal = $(b).text();
      var correspondingCol = returnedColOrder[a];
      var correspondingColName = app.data[0][correspondingCol];
      var isAtt = app.dataColumnTypes[correspondingCol] === 'attribute' ? true : false;
      if (isAtt) {
        app.rowFilter[correspondingCol] = cellVal
      }
    });
    app.drillDown();
  })
}

app.drillDown = function() {
  var subSet = [];
  subSet[0] = app.data[0];
  var unfilteredDataRows = [];
  _.each(this.data, function(row, index) {
    // only run if not the header row
    if (index) {
      var tempRowObj = {};
      _.each(row, function(cell, i) {
        tempRowObj[i] = cell;
      });
      unfilteredDataRows.push(tempRowObj);
    }
  });
  var filteredResults = _.where(unfilteredDataRows, app.rowFilter) 
  _.each(filteredResults, function(rowObj) {
    subSet.push(_.toArray(rowObj));
  });
  this.drawSubReport(subSet);
}

app.drawSubReport = function(subSet) {
  var numberWithCommas = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  var $table = $('#sub-report').empty();
  _.each(subSet, function(row, i) {
    if (i === 0) {
      var $newRow = $('<tr />')
      _.each(row, function(cell) {
        $newRow.append($('<th />').text(cell));
      });
      $newRow.appendTo($table); 
    } else {      
      var $newRow = $('<tr />')
      _.each(row, function(cell) {
        $newRow.append($('<td />').text(numberWithCommas(cell)));
      });
      $newRow.appendTo($table);
    }
  });
}

app.addColumn = function(colIndex) {
  this.selectedColumns.push(colIndex);
  this.rowSummarizer();
}

app.removeCol = function(colIndex) {
  this.selectedColumns = _.without(this.selectedColumns, +colIndex);
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
  this.drawAvailableColHeaders();
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