```
import React from 'react';
import './App.css';

import SCRViewer from './lib/SCRViewer';

import saccade from './datasample/saccade.json';
import pursuit from './datasample/pursuit.json';
import antisaccade from './datasample/antisaccade.json';
import saccade_sky from './datasample/saccade_sky.json';



function App() {
  const [dataNumber,set_dataNumber] = React.useState(0);

  
  const s3data = React.useMemo(()=>{

    let newraw;
    if(dataNumber===0){
      // console.log(teleport);
      newraw =saccade_sky;
    }
    else if(dataNumber===1){
      // console.log(teleport);
      newraw =saccade;
    }
    else if(dataNumber===2){
      newraw =pursuit;
    }
    else if(dataNumber===3){
      newraw =antisaccade;
    }


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
      console.log("데이터",newraw);
      return newraw;
      // return newraw;
    }
    else{
      return null;
    }

  },[dataNumber]);



  return (
    <div className="App">
        데이터셈플 
        <select value={dataNumber} onChange={(e)=>{
          // console.log(e.target.value)
          set_dataNumber(e.target.value*1)
        }}>
           <option value={0}>saccadesky</option>
          <option value={1}>saccade</option>
          <option value={2}>pursuit</option>
          <option value={3}>antisaccade</option>
          </select>


       <div style={{width:'100%',height:'90%',outline:'1px solid red'}}>
          <SCRViewer s3data={s3data} />
       </div>
    </div>
  );
}

export default App;

```