var app = {};

app.data = undefined;

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
  _.each(columnHeaders, function(columnHeader) {
    var col = $('<li />').text(columnHeader)
                         .addClass('list-group-item')
    $availColHeadersList.append(col);
  });
}

app.prepApp = function() {
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
        app.prepApp();
      }
      reader.readAsText(file);
    });
  });
}

app.init();