1.0.18  chartjs-plugin-datalabels => 0.7.0  
1.0.19  change calculated value  
```
import React from 'react';
import './App.css';

import GazeViewer from 'react-gazeviewer;

import saccade from 'react-gazeviewer/dist/datasample/saccade.json';
import pursuit from 'react-gazeviewer/dist/datasample/pursuit.json';
import antisaccade from 'react-gazeviewer/dist/datasample/antisaccade.json';
import _33 from "react-gazeviewer/dist/datasample/33_pursuit.json";


function App() {
  const [dataNumber,set_dataNumber] = React.useState(0);

  
  const dataArr = React.useMemo(()=>{
    let da =[saccade,pursuit,antisaccade,_33];
    for(let i = 0 ; i<da.length; i++){
      let newraw= da[i];
      if(newraw){
        // console.log("newraw",newraw);
        let gazeData = newraw.gazeData;
  
        let gazeProperty =  newraw.gazeProperty;
        let newgazeData=[];
        for(let i = 0 ; i <gazeData.length; i++){
  
          let data = gazeData[i];
          let newdata=[];
          // console.log(data);
          for(let j = 0 ; j <data.length; j++){
            let oneEye = data[j];
            // console.log("oneEye",oneEye);
            let newEye ={};
            for(let k = 0; k<gazeProperty.length; k++){
                newEye[gazeProperty[k]] = oneEye[k];
            }
            // console.log(newEye);
            newdata.push(newEye);
          }
          newgazeData.push(newdata);
        }
        
        newraw.taskArr = newgazeData;
        // console.log("데이터",newraw);
      }
    }

    // console.log(da);
    return da;
  },[]);


  return (
    <div className="App">

      <div style={{height:'40px',width:'100%'}}>
        sampleData 
        <select value={dataNumber} onChange={(e)=>{
            // console.log(e.target.value)
            set_dataNumber(e.target.value*1)
          }}>

            <option value={0}>saccade</option>
            <option value={1}>pursuit</option>
            <option value={2}>antisaccade</option>
            <option value={3}>33_pursuit</option>
          </select>
      </div>

       <div style={{width:'calc(100% - 40px)',height:'calc(100% - 80px)',border:'1px solid #7367f0',boxSizing:'border-box' , margin:'20px'}}>
           <GazeViewer data={dataArr[dataNumber]} />
       </div>
    </div>
  );
}

export default App;



```