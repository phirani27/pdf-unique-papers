const is_date = function(input) { 
    if (new Date(input) === "Invalid Date" ) 
        return false; 
    return true; 
};

export const csvToArray = ( strData, strDelimiter ) => {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");
    let rowInfo = {
        "Quantity":-1,
        "Particulars":-1,
        "Consignee/Buyer":-1,
        "Date":-1,
        "Vch No.":-1
    }

    let firstLineBool = false;

    var checkForvalidRow = (checkArr) =>{
        let isValidRow = false;
        let rowType = "detailed";

        if(checkArr[rowInfo["Quantity"]]==="Quantity"){
            return false;
        }

        if(checkArr[rowInfo["Quantity"]] || (checkArr[rowInfo["Date"]] &&
                                             is_date(checkArr[rowInfo["Date"]]) && 
                                             checkArr[rowInfo["Particulars"]] &&
                                             checkArr[rowInfo["Particulars"]].indexOf("cancelled") === -1) ){
            isValidRow = true;
        }

        if(isValidRow && (checkArr[rowInfo["Particulars"]] === checkArr[rowInfo["Consignee/Buyer"]])){
            rowType = "new";
        }

        return isValidRow ? rowType : isValidRow;
    };

    var createNewRow = (newRowArr) =>{
        let obj = {};
        for( var key in rowInfo){
          obj[key] = newRowArr[rowInfo[key]];
        }

        obj["details"] = [];
        return obj;
    };

    var createNewDetail = (detailRowArr) =>{
        let obj = {};

        obj["Particulars"] = detailRowArr[rowInfo["Particulars"]];
        obj["Quantity"] = detailRowArr[rowInfo["Quantity"]];

         return obj; 
    };

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );

    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;
    var temp = [];
    var tempObj = {};

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){          
        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        
        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.\
        if (
            
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.

            if(!firstLineBool){
                if(temp.includes("Date")){
                    firstLineBool = true;
                    let isValidFile = true;
                    for(var key in rowInfo){
                        let indexElem = temp.indexOf(key);
                        if(indexElem===-1){
                            //throw error
                            console.log(indexElem);
                            console.log("Missing column "+key);
                            arrData = {error:true, message:"Missing column "+key};
                            isValidFile = false;
                            break;
                        }else{
                          rowInfo[key] = indexElem;  
                        }
                    }
                    if(!isValidFile){
                        break;
                    }
                }  
            }
            

            if(firstLineBool){
                let rowType = checkForvalidRow(temp);

                if(rowType==="new"){
                  if(Object.keys(tempObj).length === 0 && tempObj.constructor === Object){
                    //first row...
                  }else{
                      arrData.push( tempObj ); 
                  }
                  tempObj = createNewRow(temp);
                }else if(rowType==="detailed"){
                  let deatiledRow = createNewDetail(temp);
                  tempObj["details"].push(deatiledRow);
                }

                
            }

            temp = [];
        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ];

        }

        // Now that we have our value string, let's add
        // it to the data array.
        temp.push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
};  