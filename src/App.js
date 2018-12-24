import React, { Component } from 'react';
import logo from './logo.svg';
//import * as pdfPrint from 'pdfmake';
import pdfMake from 'pdfmake/build/pdfmake';
import vfsFonts from 'pdfmake/build/vfs_fonts'
import $ from "jquery";
import {csvToArray} from "./utils";
import {_template,dTemplate,dTemplateBottom} from "./templates";
import './App.css';

const {vfs} = vfsFonts.pdfMake;
pdfMake.vfs = vfs;


class App extends Component {

  state = {
    error: null
  }

exceptions = ["cancelled"];

loader = {
    show: function($parentElem){
        let isParent = ($parentElem instanceof $);
        let loaderStr = '<div class="'+(isParent ?'':'lds-overlay-fixed')+' lds-ellipsis"><div></div><div></div><div></div><div></div><div></div><div></div>';
        let overlayStr = '<div class="'+(isParent ?'':'lds-overlay-fixed')+' lds-overlay"></div>';
        $parentElem = (isParent) ? $parentElem : $("body");
        $parentElem.append(loaderStr);
        $parentElem.append(overlayStr);
    },
    hide: function($parentElem){
        $parentElem = $parentElem instanceof $ ? $parentElem : $("body");
        $parentElem.find(".lds-ellipsis").remove();
        $parentElem.find(".lds-overlay").remove();
    }
};     

  makePDF = (data) =>{

    let content = [];

    //for(var i=4;i<7;i++){
    for(var i=0;i<data.length;i++){
      let template = _template.map((obj)=>{
                        return $.extend(true,{},obj);
                    });


      template[1]["table"]["body"][1][0]["text"] = data[i]["Consignee/Buyer"];
	  template[1]["table"]["body"][0][1]["text"] = data[i]["Vch No."];
      template[1]["table"]["body"][1][1]["text"] = "Date: " + data[i]["Date"];

      

      let detailsContent = [[
        {"text":"DESCRIPTION OF GOODS",fontSize:12,style:"deliveryChalan"},
        {"text":"QUANTITY",fontSize:12,style:"deliveryChalan"},
        {"text":"RATE",fontSize:12,style:"deliveryChalan"},
        {"text":"PER",fontSize:12,style:"deliveryChalan"}
      ]];

      let lenRows = data[i]["details"].length;

      for(var j=0;j<lenRows;j++){
        let dNewTemplate  = dTemplate.map((obj)=>{
                                return $.extend(true,{},obj);
                            });
        if(data[i]["details"][j]){
            dNewTemplate[0]["text"] = data[i]["details"][j]["Particulars"];
            dNewTemplate[1]["text"] = data[i]["details"][j]["Quantity"];
        }
        
        detailsContent.push(dNewTemplate);
      }

      template[3]["table"]["body"] = detailsContent.concat([dTemplateBottom]);

      var arrH = [];
      for (var k = 0; k < lenRows; k++) {
        arrH.push(10);
      }
        
      let heightsArr = lenRows > 4 ? ["auto"] : ["auto"].concat(arrH.map((obj,index)=>{
                                                                    let diff = lenRows - index;
                                                                    return diff === 1 ? (100 - (25*(lenRows-1))): "auto";
                                                                }));

      template[3]["table"]["heights"] = heightsArr;

      template[9]["table"]["body"][1][0]["text"] = data[i]["Consignee/Buyer"];
	  template[9]["table"]["body"][0][1]["text"] = data[i]["Vch No."];
      template[9]["table"]["body"][1][1]["text"] = "Date: " + data[i]["Date"];

      template[11]["table"]["body"] = detailsContent.concat([dTemplateBottom]);
      template[11]["table"]["heights"] = heightsArr;

      content = content.concat(template);
    }

    var dd = {
      content: content,
      styles: {
          deliveryChalan:{
              fontSize:8,
              alignment:"center"
          },
          tableSection1:{
              border: "none"
          }
      },
      defaultStyle: {
        // alignment: 'justify'
      }
    };

    //console.log(JSON.stringify(dd));

    pdfMake.createPdf(JSON.parse(JSON.stringify(dd))).download('challan.pdf');
    setTimeout(()=>{
        this.loader.hide();
    },5000);
  }

  isValidFile = (sFilename) => {
    if(sFilename.indexOf(".csv") === -1){
      if(sFilename.indexOf(".xls") > -1){
        this.setState({error:sFilename+" not a valid csv file format. Conert the file into csv in excel application."})
      }else{
        this.setState({error:sFilename+" not a valid csv file format."})
      }
      this.loader.hide();
      return false;
    }else{
      return true;
    }
  };

  filePicked = (oEvent) => {
    // Get The File From The Input
    this.loader.show();
    var oFile = oEvent.target.files[0];
    var sFilename = oFile.name;
    // Create A File Reader HTML5
    var reader = new FileReader();

    if(!this.isValidFile(sFilename)){
      return true;
    }
    
    // Ready The Event For When A File Gets Selected
    reader.onload = (e) => {
        var data = e.target.result;
        
        data = csvToArray(data);
        console.log(data);
        if($.isArray(data)){
          this.makePDF(data);
        }else if(data["error"]){
          this.loader.hide();
          this.setState({error:data["message"]});
        }
    };
    
    // Tell JS To Start Reading The File.. You could delay this if desired
    reader.readAsBinaryString(oFile);
  }


  render() {
    let errorElem = "";
    if(this.state.error){
      errorElem = (<div className="error"><b>{this.state.error}</b></div>);
    }

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Welcome to Unique Papers</h1>
        </header>
        <p className="App-intro">
            <input
                type="file" 
                className="Upload"
                accept=".csv"
                onChange={this.filePicked}
            />
            <br/>
             Upload Challan CSV 
            {errorElem}
        </p>
      </div>
    );
  }
}

export default App;
