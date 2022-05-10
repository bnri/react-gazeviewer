import React from "react";
import './GazeViewer.scss';
import _ from 'lodash';
import { Line } from "react-chartjs-2"
import "chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js";
import "chartjs-plugin-datalabels";
import "chartjs-plugin-annotation";
import { SVD } from 'svd-js'
import {
    mean, std, distance,transpose,multiply
    // atan2, chain, derivative, e, evaluate, log, pi, pow, round, sqrt
} from 'mathjs'
// console.log(mean);
// console.log(std);
// console.log(math);
// console.log(regression);

//https://github.com/Meakk/ellipse-js

//https://stackoverflow.com/questions/47873759/how-to-fit-a-2d-ellipse-to-given-points
//다시 이거로 합시다
//https://stackoverflow.com/questions/58832206/draw-ellipse-with-5points-in-canvas
//이거ㅏ로 해봅시다

//https://stackoverflow.com/questions/16716302/how-do-i-fit-a-sine-curve-to-my-data-with-pylab-and-numpy


//그나마 찾은 ㄱㅊ은것.. 머신러닝임 마찬가지로
//https://github.com/mljs/levenberg-marquardt


//advanced regression 모듈 우리꺼에 추가할것..
/*
saccade
 => "analysis": { "type": "saccade", "direction": "top" }

top | bottom | left | right

pursuit 
 => "analysis": { "type": "pursuit", "direction": "clockwise", "rotationCount": 2 }
 => "analysis": { "type": "pursuit", "direction": "anticlockwise", "rotationCount": 2 }

antisaccade
 => "analysis": { "type": "antisaccade", "direction": "right" }

*/


let lineChart;

const GazeViewer = React.forwardRef(({ ...props }, ref) => {
    const { data } = props;

    const [nowTime, set_nowTime] = React.useState(0);
    const [taskNumber, set_taskNumber] = React.useState(0);
    const [playSpeed, set_playSpeed] = React.useState(1);

    const [isPlaying, set_isPlaying] = React.useState(false);

    const gazeRef = React.useRef();
    const canvasRef = React.useRef();

    const [innerFrameScale, set_innerFrameScale] = React.useState(0);
    const [innerFrameTop, set_innerFrameTop] = React.useState(0);
    const [innerFrameLeft, set_innerFrameLeft] = React.useState(0);

    const resizeInnerFrame = React.useCallback(() => {
        if (!gazeRef.current) return;

        const resize100 = _.debounce(() => {


            const pastScreenW = data.screenW;
            const pastScreenH = data.screenH;
            //console.log(pastScreenW + 'x' + pastScreenH);
            let pastRatio = pastScreenH / pastScreenW;



            const width = gazeRef.current.clientWidth;
            const height = gazeRef.current.clientHeight;

            // console.log("지금width:"+width);
            // console.log("지금height:"+height);
            //
            let nowRatio = height / width;

            // console.log("과거비율:" + pastRatio);
            // console.log("지금비율:" + nowRatio);


            //지금비율이 더크다는건=>지금가로가 더 작다  그말은 [높이기준]
            // 798 : x = 1920 * 1080   =>  1920*x = 1080 * 798

            //1268 지금
            //1239
            if (nowRatio >= pastRatio) {
                // console.log("지금세로가 더크다 - 가로기준 셋팅");
                set_innerFrameScale(width / pastScreenW);


                let newheight = pastScreenH * (width / pastScreenW);
                set_innerFrameTop((height - newheight) / 2);
                set_innerFrameLeft(0);
            }
            else {
                // console.log("지금 가로가 더 크다 (지금비율이 더 작다)-높이기준셋팅");
                set_innerFrameScale(height / pastScreenH);


                let newwidth = pastScreenW * (height / pastScreenH);
                set_innerFrameTop(0);
                set_innerFrameLeft((width - newwidth) / 2);

            }
        }, 100);


        resize100();



    }, [data]);


    const [justoneTimeResizeTwice, set_justoneTimeResizeTwice] = React.useState(true);
    React.useEffect(() => {


        resizeInnerFrame();
        // set_taskNumber(0);
        // set_nowTime(0);

        window.addEventListener('resize', resizeInnerFrame);
        if (justoneTimeResizeTwice) {
            set_justoneTimeResizeTwice(false);
            resizeInnerFrame();
        }

        return () => {
            //console.log("소멸자");
            window.removeEventListener('resize', resizeInnerFrame);
        }
    }, [resizeInnerFrame, justoneTimeResizeTwice]);





    const taskArr = React.useMemo(() => {
        if (data) {
            console.log("원본json", data);
            // console.log(data);
            let newData = [];


            for (let i = 0; i < data.screeningObjectList.length; i++) {
                let obj = {
                    ...data.screeningObjectList[i],
                    gazeData: data.taskArr[i]
                };
                newData.push(obj);
            }


            const MONITOR_PX_PER_CM = data.monitorInform.MONITOR_PX_PER_CM;
            const pixel_per_cm = data.monitorInform.MONITOR_PX_PER_CM; //1cm 당 pixel
            const degree_per_cm = Math.atan(1 / data.defaultZ) * 180 / Math.PI;
            const w = data.screenW;
            const h = data.screenH;



            
            //newData 의 trial 수만큼 반복
            for (let i = 0; i < newData.length; i++) {
                const task = newData[i];

                const type = task.type;


                //gazeraw에 degree로 변환작업
                let gazeArr = task.gazeData;

                for (let j = 0; j < gazeArr.length; j++) {
                    let target_pixels = {
                        x: null,
                        y: null,
                    }
                    if (type === 'teleport') {
                        //2~5 고정임

                        if (gazeArr[j].relTime * 1 < task.startWaitTime * 1) {
                            target_pixels.x = task.startCoord.x - w / 2;
                            target_pixels.y = task.startCoord.y - h / 2;

                        }
                        else if (gazeArr[j].relTime * 1 < (task.duration * 1 + task.startWaitTime * 1)) {
                            target_pixels.x = task.endCoord.x - w / 2;
                            target_pixels.y = task.endCoord.y - h / 2;
                        }
                        else {
                            if (task.isReturn) {
                                target_pixels.x = task.startCoord.x - w / 2;
                                target_pixels.y = task.startCoord.y - h / 2;
                            }
                            else {
                                target_pixels.x = task.endCoord.x - w / 2;
                                target_pixels.y = task.endCoord.y - h / 2;
                            }

                        }
                        let target_xcm = target_pixels.x / pixel_per_cm;
                        let target_ycm = target_pixels.y / pixel_per_cm;
                        let target_xdegree = target_xcm * degree_per_cm;
                        let target_ydegree = target_ycm * degree_per_cm;
                        gazeArr[j].target_xdegree = target_xdegree;
                        gazeArr[j].target_ydegree = target_ydegree;

                    }
                    else if (type === 'circular') {

                        const radian = Math.PI / 180;
                        const radius = task.radius;

                        if (gazeArr[j].relTime * 1 < task.startWaitTime) {
                            const cosTheta = Math.cos(task.startDegree * radian);
                            const sineTheta = Math.sin(task.startDegree * radian);
                            target_pixels.x = task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM - w / 2;
                            target_pixels.y = task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM - h / 2;

                        }
                        else if (gazeArr[j].relTime * 1 < (task.duration * 1 + task.startWaitTime * 1)) {
                            let nowDegree = -((task.startDegree - task.endDegree) *
                                (gazeArr[j].relTime - task.startWaitTime) / task.duration - task.startDegree);
                            const cosTheta = Math.cos(nowDegree * radian);
                            const sineTheta = Math.sin(nowDegree * radian);
                            target_pixels.x = task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM - w / 2;
                            target_pixels.y = task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM - h / 2;
                        }
                        else {
                            const cosTheta = Math.cos(task.endDegree * radian);
                            const sineTheta = Math.sin(task.endDegree * radian);
                            target_pixels.x = task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM - w / 2;
                            target_pixels.y = task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM - h / 2;

                        }
                        let target_xcm = target_pixels.x / pixel_per_cm;
                        let target_ycm = target_pixels.y / pixel_per_cm;
                        let target_xdegree = target_xcm * degree_per_cm;
                        let target_ydegree = target_ycm * degree_per_cm;
                        gazeArr[j].target_xdegree = target_xdegree;
                        gazeArr[j].target_ydegree = target_ydegree;
                    }


                    if (gazeArr[j].RPOGV) {
                        let xpixel = (gazeArr[j].RPOGX - 0.5) * w
                        let ypixel = (gazeArr[j].RPOGY - 0.5) * h

                        let xcm = xpixel / pixel_per_cm;
                        let ycm = ypixel / pixel_per_cm;
                        let xdegree = xcm * degree_per_cm;
                        let ydegree = ycm * degree_per_cm;

                        gazeArr[j].xdegree = xdegree;
                        gazeArr[j].ydegree = ydegree;


                    }
                    else {
                        gazeArr[j].xdegree = null;
                        gazeArr[j].ydegree = null;

                    }

                }

                //분석 하기..


                if (task.analysis.type==="saccade") {
                

                    let A_ydegree_arr = [];
                    let A_xdegree_arr = [];
                    let B_ydegree_arr = [];
                    let B_xdegree_arr = [];


                    task.stabletime = {
                        A_s: null,
                        A_e: null,
                        B_s: null,
                        B_e: null,
                    }


                    for (let j = 0; j < gazeArr.length; j++) {

                        if (gazeArr[j].relTime * 1 >= (task.startWaitTime * 1 - 2) &&
                            gazeArr[j].relTime * 1 <= task.startWaitTime * 1) {
                            if (task.stabletime.A_s === null) {
                                task.stabletime.A_s = gazeArr[j].relTime;
                            }
                            task.stabletime.A_e = gazeArr[j].relTime;


                            if (gazeArr[j].xdegree !== null && gazeArr[j].ydegree !== null) {
                                A_xdegree_arr.push(gazeArr[j].xdegree);
                                A_ydegree_arr.push(gazeArr[j].ydegree);
                            }

                        }
                        else if (gazeArr[j].relTime * 1 >= (task.startWaitTime * 1 + task.duration * 1 - 2)
                            && gazeArr[j].relTime * 1 <= (task.startWaitTime * 1 + task.duration * 1)) {
                            if (task.stabletime.B_s === null) {
                                task.stabletime.B_s = gazeArr[j].relTime;
                            }
                            task.stabletime.B_e = gazeArr[j].relTime;

                            if (gazeArr[j].xdegree !== null && gazeArr[j].ydegree !== null) {
                                B_xdegree_arr.push(gazeArr[j].xdegree);
                                B_ydegree_arr.push(gazeArr[j].ydegree);
                            }


                        }



                    }

                    let temp={

                    };

                    temp.A_mean_ydegree = (A_ydegree_arr.length && mean(A_ydegree_arr)) || null;
                    temp.A_mean_xdegree = (A_xdegree_arr.length && mean(A_xdegree_arr)) || null;
                    temp.A_std_ydegree = (A_ydegree_arr.length && std(A_ydegree_arr)) || null;
                    temp.A_std_xdegree = (A_xdegree_arr.length && std(A_xdegree_arr)) || null;


                    temp.B_mean_ydegree = (B_ydegree_arr.length && mean(B_ydegree_arr)) || null;
                    temp.B_mean_xdegree = (B_xdegree_arr.length && mean(B_xdegree_arr)) || null;
                    temp.B_std_ydegree = (B_ydegree_arr.length && std(B_ydegree_arr)) || null;
                    temp.B_std_xdegree = (B_xdegree_arr.length && std(B_xdegree_arr)) || null;
                    A_ydegree_arr = [];
                    A_xdegree_arr = [];
                    B_ydegree_arr = [];
                    B_xdegree_arr = [];
                    //2표준편차밖을 제외하고 다시 구함
                    for (let j = 0; j < gazeArr.length; j++) {

                        if (gazeArr[j].relTime * 1 >= (task.startWaitTime * 1 - 2) &&
                            gazeArr[j].relTime * 1 <= task.startWaitTime * 1) {
                            if (task.stabletime.A_s === null) {
                                task.stabletime.A_s = gazeArr[j].relTime;
                            }
                            task.stabletime.A_e = gazeArr[j].relTime;


                            if (gazeArr[j].xdegree !== null && gazeArr[j].ydegree !== null) {
                                if(distance([0,temp.A_mean_xdegree],[0,gazeArr[j].xdegree])<=temp.A_std_xdegree){
                                    A_xdegree_arr.push(gazeArr[j].xdegree);
                                }
                                if(distance([0,temp.A_mean_ydegree],[0,gazeArr[j].ydegree])<=temp.A_std_ydegree){
                                    A_ydegree_arr.push(gazeArr[j].ydegree);
                                }
                            
                            
                            }

                        }
                        else if (gazeArr[j].relTime * 1 >= (task.startWaitTime * 1 + task.duration * 1 - 2)
                            && gazeArr[j].relTime * 1 <= (task.startWaitTime * 1 + task.duration * 1)) {
                            if (task.stabletime.B_s === null) {
                                task.stabletime.B_s = gazeArr[j].relTime;
                            }
                            task.stabletime.B_e = gazeArr[j].relTime;

                            if (gazeArr[j].xdegree !== null && gazeArr[j].ydegree !== null) {
                                if(distance([0,temp.B_mean_xdegree],[0,gazeArr[j].xdegree])<=temp.B_std_xdegree){
                                    B_xdegree_arr.push(gazeArr[j].xdegree);
                                }
                                if(distance([0,temp.B_mean_ydegree],[0,gazeArr[j].ydegree])<=temp.B_std_ydegree){
                                    B_ydegree_arr.push(gazeArr[j].ydegree);
                                }
                            }
                        }
                    }
                    task.A_mean_ydegree = (A_ydegree_arr.length && mean(A_ydegree_arr)) || null;
                    task.A_mean_xdegree = (A_xdegree_arr.length && mean(A_xdegree_arr)) || null;
                    task.A_std_ydegree = (A_ydegree_arr.length && std(A_ydegree_arr)) || null;
                    task.A_std_xdegree = (A_xdegree_arr.length && std(A_xdegree_arr)) || null;


                    task.B_mean_ydegree = (B_ydegree_arr.length && mean(B_ydegree_arr)) || null;
                    task.B_mean_xdegree = (B_xdegree_arr.length && mean(B_xdegree_arr)) || null;
                    task.B_std_ydegree = (B_ydegree_arr.length && std(B_ydegree_arr)) || null;
                    task.B_std_xdegree = (B_xdegree_arr.length && std(B_xdegree_arr)) || null;




                    task.sample = {
                        start_position: {
                            x: task.A_mean_xdegree,
                            y: task.A_mean_ydegree
                        },
                        end_position: {
                            x: task.B_mean_xdegree,
                            y: task.B_mean_ydegree
                        },
                        saccade_distance: distance([task.A_mean_xdegree, task.A_mean_ydegree], [task.B_mean_xdegree, task.B_mean_ydegree]),
                        fixation_threshold: 1,
                        startTime: null,
                        endTime: null,
                        saccade_delay: null,
                        saccade_duration: null,
                        saccade_speed: null, //degree / sec
                        fixation_stability: null,

                    }

             
                    for (let j = 0; j < gazeArr.length; j++) {

                        if (j < gazeArr.length - 3 && gazeArr[j].relTime * 1 >= task.startWaitTime * 1) {
                            //gazeArr[j].xdegree , gazeArr[j].ydegree
                            //와 거리가
                            // 0.5 이상인친구가
                            //A_mean_xdegree ,A_mean_ydegree 
                            if (
                                distance([gazeArr[j].xdegree, gazeArr[j].ydegree], [task.A_mean_xdegree, task.A_mean_ydegree]) >= task.sample.fixation_threshold
                                && distance([gazeArr[j + 1].xdegree, gazeArr[j + 1].ydegree], [task.A_mean_xdegree, task.A_mean_ydegree]) >= task.sample.fixation_threshold
                                && distance([gazeArr[j + 2].xdegree, gazeArr[j + 2].ydegree], [task.A_mean_xdegree, task.A_mean_ydegree]) >= task.sample.fixation_threshold) {
                                task.sample.startTime = gazeArr[j].relTime * 1;
                                task.sample.saccade_delay = gazeArr[j].relTime * 1 - task.startWaitTime * 1;
                                
                                break;
                            }
                        }
                    }

                    
                    for (let j = 0; j < gazeArr.length; j++) {
                        if (j < gazeArr.length - 3 && task.sample.startTime !== null && gazeArr[j].relTime * 1 >= task.sample.startTime * 1) {
                            //gazeArr[j].xdegree , gazeArr[j].ydegree
                            //와 거리가
                            // 0.5 이상인친구가
                            //A_mean_xdegree ,A_mean_ydegree 
                            if (
                                distance([gazeArr[j].xdegree, gazeArr[j].ydegree], [task.B_mean_xdegree, task.B_mean_ydegree]) <= task.sample.fixation_threshold
                                && distance([gazeArr[j + 1].xdegree, gazeArr[j + 1].ydegree], [task.B_mean_xdegree, task.B_mean_ydegree]) <= task.sample.fixation_threshold
                                && distance([gazeArr[j + 2].xdegree, gazeArr[j + 2].ydegree], [task.B_mean_xdegree, task.B_mean_ydegree]) <= task.sample.fixation_threshold) {
                                task.sample.endTime = gazeArr[j].relTime * 1;
                                task.sample.saccade_duration = task.sample.endTime - task.sample.startTime;
                                task.sample.saccade_speed = task.sample.saccade_distance / task.sample.saccade_duration;

                                break;
                            }
                        }
                    }



                    // 여기서도 제외를 해야하는데...
                    let B_xydiff_arr = [];
                    for (let j = 0; j < gazeArr.length; j++) {

                        if (gazeArr[j].relTime * 1 >= (task.startWaitTime * 1 + task.duration * 1 - 2)
                            && gazeArr[j].relTime * 1 <= (task.startWaitTime * 1 + task.duration * 1)) {


                            if (gazeArr[j].xdegree !== null && gazeArr[j].ydegree !== null) {
                                if(distance([0,temp.B_mean_xdegree],[0,gazeArr[j].xdegree])<=temp.B_std_xdegree
                                && distance([0,temp.B_mean_ydegree],[0,gazeArr[j].ydegree])<=temp.B_std_ydegree){
                                    B_xydiff_arr.push(distance([task.B_mean_xdegree, task.B_mean_ydegree], [gazeArr[j].xdegree, gazeArr[j].ydegree]));
                                }
                            }
                        }

                    }


                    task.sample.fixation_stability = (B_xydiff_arr.length && std(B_xydiff_arr)) || null;
          
                    
                   
                }
                else if(task.analysis.type==='pursuit'){

                    task.sample={

                    }
                    let rotation_dataset=[];
                    let rdx=[];
                    let rdy=[];
                    let homogeneous_linear_dataset=[];
                    for (let j = 0; j < gazeArr.length; j++) {

                        if (gazeArr[j].relTime * 1 >= (task.startWaitTime * 1) &&
                            gazeArr[j].relTime * 1 <= (task.relativeEndTime-task.endWaitTime * 1) ) {
                            
                          
                            //startWaitTime  ~  relativeEndTime - endWaitTime 
                            rdx.push(gazeArr[j].xdegree);
                            rdy.push(gazeArr[j].ydegree);
                            //startWaitTime 
                            // ax^2 + bxy + cy^2 + dx + ey + f = 0; //식을두고,
                            // x^2 , xy , y^2 , x , y , 1
                            homogeneous_linear_dataset.push([
                                gazeArr[j].xdegree*gazeArr[j].xdegree, //X^2
                                gazeArr[j].xdegree*gazeArr[j].ydegree, //XY
                                gazeArr[j].ydegree*gazeArr[j].ydegree, // Y^2
                                gazeArr[j].xdegree, //X
                                gazeArr[j].ydegree, //Y
                                ])
                            
                        }
                    }
                    let rdxmean = mean(rdx);
                    let rdymean = mean(rdy);
                    for (let j = 0; j < gazeArr.length; j++) {

                        if (gazeArr[j].relTime * 1 >= (task.startWaitTime * 1) &&
                            gazeArr[j].relTime * 1 <= (task.relativeEndTime-task.endWaitTime * 1) ) {
                            
                            rotation_dataset.push([gazeArr[j].xdegree-rdxmean,gazeArr[j].ydegree-rdymean ]);
                            //startWaitTime  ~  relativeEndTime - endWaitTime 
       
                            //startWaitTime 

                        }
                    }


                    const { u, v, q } = SVD(rotation_dataset);
                    // const resnew = SVD(homogeneous_linear_dataset,false,true);
                
                    
                    task.rotation_dataset = {
                        rdxmean : rdxmean,
                        rdymean: rdymean,
                        data:rotation_dataset,
                        u:u, //1202 * 2
                        v:v, //2*2   //v는 항등행렬로 치고 무시합시다. (첫 회전 X)
                        q:q, // 1*2
                      
                        mq: [q[0]*Math.sqrt(2/rotation_dataset.length),q[1]*Math.sqrt(2/rotation_dataset.length)], //(x/q[0])^2 + (y/q[1])^2 = 1 타원
                        //sqrt(2/N) * U * diag(S)  회전을 제외 U
                        
                    }
                    //소장님과 토론할것

                    //  [ [q[0],0][0,q[1]] ]  //만들면좋음

                    // 루트 1/1202 * 
                    
                }

            }

            //개별데이터 끝났고 다시 한다고 가정
     

            
            if(data.screeningType==='saccade'){
                let up_saccade_delay_arr=[];
                let down_saccade_delay_arr=[];
                let left_saccade_delay_arr=[];
                let right_saccade_delay_arr=[];
                
                let up_saccade_speed_arr=[];
                let down_saccade_speed_arr=[];
                let left_saccade_speed_arr=[];
                let right_saccade_speed_arr=[];

                let up_fixation_stability_arr=[];
                let down_fixation_stability_arr=[];
                let left_fixation_stability_arr=[];
                let right_fixation_stability_arr=[];
                
                for (let i = 0; i < newData.length; i++) {
                    const task = newData[i];
    
                    const direction = task.analysis.direction;
                    if(direction==='top'){
                        up_saccade_delay_arr.push(task.sample.saccade_delay);
                        up_saccade_speed_arr.push(task.sample.saccade_speed);
                        up_fixation_stability_arr.push(task.sample.fixation_stability);
                    }
                    else if(direction==='bottom'){
                        down_saccade_delay_arr.push(task.sample.saccade_delay);
                        down_saccade_speed_arr.push(task.sample.saccade_speed);
                        down_fixation_stability_arr.push(task.sample.fixation_stability);
                    }
                    else if(direction==='left'){
                        left_saccade_delay_arr.push(task.sample.saccade_delay);
                        left_saccade_speed_arr.push(task.sample.saccade_speed);
                        left_fixation_stability_arr.push(task.sample.fixation_stability);
                    }
                    else if(direction==='right'){
                        right_saccade_delay_arr.push(task.sample.saccade_delay);
                        right_saccade_speed_arr.push(task.sample.saccade_speed);
                        right_fixation_stability_arr.push(task.sample.fixation_stability);
                    }
                }

                let saveData={
                    up_saccade_delay : mean(up_saccade_delay_arr),
                    down_saccade_delay : mean(down_saccade_delay_arr),
                    left_saccade_delay : mean(left_saccade_delay_arr),
                    right_saccade_delay : mean(right_saccade_delay_arr),      
                    
                    up_saccade_speed : mean(up_saccade_speed_arr),
                    down_saccade_speed : mean(down_saccade_speed_arr),
                    left_saccade_speed : mean(left_saccade_speed_arr),
                    right_saccade_speed : mean(right_saccade_speed_arr),

                           
                    up_fixation_stability : mean(up_fixation_stability_arr),
                    down_fixation_stability : mean(down_fixation_stability_arr),
                    left_fixation_stability : mean(left_fixation_stability_arr),
                    right_fixation_stability : mean(right_fixation_stability_arr),
                }
                console.log("saveData", saveData);
            }
            else if(data.screeningType==='pursuit'){
                console.log("분석 pursuit")
               
            }
            
            
            console.log("newData", newData);

 

            return newData;
        }
        else {
            return null;
        }
    }, [data]);

    const endTime = React.useMemo(() => {
        if (taskArr && taskArr[taskNumber]) {
            // console.log("지금꺼정보", taskArr[taskNumber]);

            return (taskArr[taskNumber].relativeEndTime).toFixed(2);
        }
        else {
            return null;
        }
    }, [taskArr, taskNumber])




    const handleBtnPlay = () => {
        if (nowTime * 1 === endTime * 1) {
            set_nowTime(0);
        }
        set_isPlaying(!isPlaying);
    }

    React.useEffect(() => {
        if(endTime!==null){
            set_nowTime(endTime);
        }
    }, [endTime])

    React.useEffect(() => {


        let myrequest;
        let startTime = Date.now();
        function timeUpdate() {
            myrequest = window.requestAnimationFrame(timeUpdate);
            let now = Date.now();
            let elapsed = now - startTime;
            // console.log("fps", 1000 / elapsed);
            startTime = now;
            set_nowTime((nt) => {
                if (nt * 1 >= endTime) {

                    set_isPlaying(false);
                    nt = endTime;

                    return nt;
                }
                else {
                    nt = nt * 1 + (elapsed / 1000) * playSpeed
                    return nt;
                }
            });
        }
        if (isPlaying === true) {
            timeUpdate();
        }
        else {
            window.cancelAnimationFrame(myrequest);
        }
        return () => {
            window.cancelAnimationFrame(myrequest);
        }
    }, [isPlaying, endTime, playSpeed]);




    const [targetLeft, set_targetLeft] = React.useState(0);

    const [targetTop, set_targetTop] = React.useState(0);

    const setTargetLocation = React.useCallback(() => {
        // console.log("setTargetLocation!!")
        const task = taskArr[taskNumber];
        if (!task) return;

        
        const type = task.type;
        const MONITOR_PX_PER_CM = data.monitorInform.MONITOR_PX_PER_CM;
        const target_size= MONITOR_PX_PER_CM * task.target_size;

        if (type === 'teleport') {
            if (nowTime * 1 < task.startWaitTime * 1) {
                //startcoord
                set_targetLeft((task.startCoord.x - target_size/2) + 'px');
                set_targetTop((task.startCoord.y - target_size/2) + 'px');
            }
            else if (nowTime * 1 < (task.duration * 1 + task.startWaitTime * 1)) {
                set_targetLeft((task.endCoord.x -target_size/2)+ 'px');
                set_targetTop((task.endCoord.y -target_size/2)+ 'px');
            }
            else {
                //endcoord
                if (task.isReturn) {
                    set_targetLeft((task.startCoord.x - target_size/2) + 'px');
                    set_targetTop((task.startCoord.y -target_size/2) +'px');
                }
                else {
                    set_targetLeft((task.endCoord.x -target_size/2)+ 'px');
                    set_targetTop((task.endCoord.y -target_size/2)+ 'px');
                }

            }
        }
        else if (type === 'circular') {
            const radian = Math.PI / 180;
            const radius = task.radius;

            if (nowTime * 1 < task.startWaitTime) {
                // console.log("첫 대기")
                const cosTheta = Math.cos(task.startDegree * radian);
                const sineTheta = Math.sin(task.startDegree * radian);
                let sc = {
                    x: task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM - target_size/2,
                    y: task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM -target_size/2
                }
                // console.log(sc);
                // console.log(target_size);
                set_targetLeft(sc.x + 'px');
                set_targetTop(sc.y + 'px');
            }
            else if (nowTime * 1 < (task.duration * 1 + task.startWaitTime * 1)) {
                // console.log(":asfasfasfsafsafasf");
                //nowdegree
                let nowDegree = -((task.startDegree - task.endDegree) * (nowTime - task.startWaitTime) / task.duration - task.startDegree);

                const cosTheta = Math.cos(nowDegree * radian);
                const sineTheta = Math.sin(nowDegree * radian);
                let nc = {
                    x: task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM - target_size/2,
                    y: task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM - target_size/2
                }
                set_targetLeft(nc.x + 'px');
                set_targetTop(nc.y + 'px');
            }
            else {
                // console.log("마지막 0.5초")
                const cosTheta = Math.cos(task.endDegree * radian);
                const sineTheta = Math.sin(task.endDegree * radian);
                let ec = {
                    x: task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM - target_size/2,
                    y: task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM - target_size/2
                }
                set_targetLeft(ec.x + 'px');
                set_targetTop(ec.y + 'px');
            }
        }

    }, [nowTime, taskArr, taskNumber, data]);

    const [RPOG_SIZE, set_RPOG_SIZE] = React.useState(3);

    const drawGaze = React.useCallback(() => {
        const task = taskArr[taskNumber];
        if (!task) return;

        let gazeArr = task.gazeData;
        const w = data.screenW;
        const h = data.screenH;
        // console.log("w",w);

        const RPOGSIZE = RPOG_SIZE;
        const canvas = canvasRef.current;
        const rctx = canvas.getContext('2d');
        rctx.clearRect(0, 0, w, h);

        // console.log("drawGaze 호출")
        for (let i = 0; i < gazeArr.length; i++) {
            if (gazeArr[i].relTime <= nowTime * 1 && gazeArr[i].RPOGV) {
                // console.log("야 여기당");

                rctx.beginPath();
                rctx.lineWidth = 0.5;
                rctx.strokeStyle = 'rgb(255,0,0,0.3)';
                rctx.fillStyle = 'rgb(255,0,0,0.3)';
                // let x = (gazeArr[i].RPOGX) * w;
                // let y = (gazeArr[i].RPOGY) * h;
                // console.log("x,y",x,y);
                rctx.arc((gazeArr[i].RPOGX) * w,
                    (gazeArr[i].RPOGY) * h, RPOGSIZE, 0, Math.PI * 2);
                rctx.fill();
                rctx.stroke();

                //그려
            }
        }

    }, [nowTime, taskArr, taskNumber, data, RPOG_SIZE]);


    const drawChart = React.useCallback(() => {

        const task = taskArr[taskNumber];
        if (!task) return;
        // const pixel_per_cm = data.monitorInform.MONITOR_PX_PER_CM; //1cm 당 pixel
        // const degree_per_cm = Math.atan(1 / data.defaultZ) * 180 / Math.PI;
        // const w = data.screenW;
        // const h = data.screenH;
        let gazeArr = task.gazeData;




        let Gdata = {
            target_x: [],
            target_y: [],
            eye_x: [],
            eye_y: [],
            fit_x:[],
            fit_y:[]
        }
        
        const type=task.analysis.type;
        let pursuit_attribute={
        };

        if(type==='pursuit'){
            pursuit_attribute.a = task.rotation_dataset.mq[0];
            pursuit_attribute.b = task.rotation_dataset.mq[1];
            pursuit_attribute.xoffset =  task.rotation_dataset.rdxmean;
            pursuit_attribute.yoffset =  task.rotation_dataset.rdymean;
            pursuit_attribute.jugi = (task.relativeEndTime - task.endWaitTime-task.startWaitTime)/task.analysis.rotationCount;
            pursuit_attribute.direction = task.analysis.direction;
        }

        // console.log("gazeArr",gazeArr);
        for (let i = 0; i < gazeArr.length; i++) {
            if (gazeArr[i].relTime <= nowTime * 1 && gazeArr[i].RPOGV) {
                // console.log("gazeArr[i].target_xdegree?",gazeArr[i]);
                // console.log("target_xdegree:",gazeArr[i].target_xdegree)
                let target_xdata = {
                    x: gazeArr[i].relTime * 1000,
                    y: gazeArr[i].target_xdegree ? gazeArr[i].target_xdegree : 0
                }
                let target_ydata = {
                    x: gazeArr[i].relTime * 1000,
                    y: gazeArr[i].target_ydegree ? gazeArr[i].target_ydegree : 0
                }
                let eye_xdata = {
                    x: gazeArr[i].relTime * 1000,
                    y: gazeArr[i].xdegree ? gazeArr[i].xdegree : 0
                }
                let eye_ydata = {
                    x: gazeArr[i].relTime * 1000,
                    y: gazeArr[i].ydegree ? gazeArr[i].ydegree : 0
                }
                let fit_xdata={};
                let fit_ydata={};
                if(type==='pursuit'){
                    
                    fit_xdata.x = gazeArr[i].relTime * 1000;
                    fit_ydata.x = gazeArr[i].relTime * 1000;
                    if(pursuit_attribute.direction==='clockwise'){
                        fit_xdata.y = pursuit_attribute.a*Math.sin(2*Math.PI/pursuit_attribute.jugi*(gazeArr[i].relTime-task.startWaitTime))+pursuit_attribute.xoffset;
                        fit_ydata.y = -pursuit_attribute.b*Math.cos(2*Math.PI/pursuit_attribute.jugi*(gazeArr[i].relTime-task.startWaitTime))+pursuit_attribute.yoffset;
                    }
                    else if(pursuit_attribute.direction==='anticlockwise'){
                        fit_xdata.y = -pursuit_attribute.a*Math.sin(2*Math.PI/pursuit_attribute.jugi*(gazeArr[i].relTime-task.startWaitTime))+pursuit_attribute.xoffset;
                        fit_ydata.y = -pursuit_attribute.b*Math.cos(2*Math.PI/pursuit_attribute.jugi*(gazeArr[i].relTime-task.startWaitTime))+pursuit_attribute.yoffset;
                    }

                    Gdata.fit_x.push(fit_xdata);
                    Gdata.fit_y.push(fit_ydata);
                }
           


                Gdata.target_x.push(target_xdata);
                Gdata.target_y.push(target_ydata);
                Gdata.eye_x.push(eye_xdata);
                Gdata.eye_y.push(eye_ydata);
                // if(fit_x)Gdata.fit_x.push(fit_x);

            }
        }

     



        if (lineChart) {
            // console.log("Gdata.target_x",Gdata.target_x);
            lineChart.chartInstance.data.datasets[0].data = Gdata.target_x;
            lineChart.chartInstance.data.datasets[1].data = Gdata.eye_x;
            lineChart.chartInstance.data.datasets[2].data = Gdata.target_y;
            lineChart.chartInstance.data.datasets[3].data = Gdata.eye_y;
            lineChart.chartInstance.data.datasets[4].data = Gdata.fit_x;
            lineChart.chartInstance.data.datasets[5].data = Gdata.fit_y;
            // if(equation){
            //     lineChart.chartInstance.data.datasets[4].data = Gdata.estimate;  
            // }
            lineChart.chartInstance.update();

        }
    }, [nowTime, taskArr, taskNumber]);



    React.useEffect(() => {
        drawChart();
    }, [drawChart]);

    React.useEffect(() => {
        setTargetLocation();
        drawGaze();
    }, [setTargetLocation, drawGaze])



    const [chartHeight] = React.useState('250');


    const Goptions = React.useMemo(() => {

        // console.log(taskArr[taskNumber]);
        //95% 신뢰구간 1.96
        // 99% 신뢰구간 2.58

        // std * 1.96 / 루트(모집단수)
        const analysis = taskArr[taskNumber].analysis || null;

        let ymin=null, ymax=null;
        if (analysis.type === 'saccade') {
            if (analysis.direction === 'top') {
                ymin = taskArr[taskNumber].A_mean_ydegree;
                ymax = taskArr[taskNumber].B_mean_ydegree;
            }
            else if (analysis.direction === 'bottom') {
                ymin = taskArr[taskNumber].B_mean_ydegree;
                ymax = taskArr[taskNumber].A_mean_ydegree;
            }
            else if (analysis.direction === 'right') {
                ymin = taskArr[taskNumber].A_mean_xdegree;
                ymax = taskArr[taskNumber].B_mean_xdegree;
            }
            else if (analysis.direction === 'left') {
                ymin = taskArr[taskNumber].B_mean_xdegree;
                ymax = taskArr[taskNumber].A_mean_xdegree;
            }
        }

        let annotation = [];
        if(taskArr[taskNumber].analysis.type==='saccade'){
            annotation = [
                {
                    drawTime: "afterDatasetsDraw", // (default)
                    type: "box",
                    mode: "horizontal",
                    yScaleID: "degree",
                    xScaleID: "timeid",
                    // value: '7.5',
                    borderColor: "green",
                    backgroundColor: "rgba(0,255,0,0.05)",
                    borderWidth: 1,
                    xMin: taskArr[taskNumber].stabletime.A_s * 1000,
                    xMax: taskArr[taskNumber].stabletime.A_e * 1000,
                    yMin: taskArr[taskNumber].A_mean_xdegree - taskArr[taskNumber].A_std_xdegree * 2,
                    yMax: taskArr[taskNumber].A_mean_xdegree + taskArr[taskNumber].A_std_xdegree * 2
                }, // A지점 X
                {
                    drawTime: "afterDatasetsDraw", // (default)
                    type: "box",
                    mode: "horizontal",
                    yScaleID: "degree",
                    xScaleID: "timeid",
                    // value: '7.5',
                    borderColor: "rgb(255,127,0)",
                    backgroundColor: "rgba(255,127,0,0.05)",
                    borderWidth: 1,
                    xMin: taskArr[taskNumber].stabletime.A_s * 1000,
                    xMax: taskArr[taskNumber].stabletime.A_e * 1000,
                    yMin: taskArr[taskNumber].A_mean_ydegree - taskArr[taskNumber].A_std_ydegree * 2,
                    yMax: taskArr[taskNumber].A_mean_ydegree + taskArr[taskNumber].A_std_ydegree * 2
                }, // A지점 Y
                {
                    drawTime: "afterDatasetsDraw", // (default)
                    type: "box",
                    mode: "horizontal",
                    yScaleID: "degree",
                    xScaleID: "timeid",
                    // value: '7.5',
                    borderColor: "green",
                    backgroundColor: "rgba(0,255,0,0.05)",
                    borderWidth: 1,
                    xMin: taskArr[taskNumber].stabletime.B_s * 1000,
                    xMax: taskArr[taskNumber].stabletime.B_e * 1000,
                    yMin: taskArr[taskNumber].B_mean_xdegree - taskArr[taskNumber].B_std_xdegree * 2,
                    yMax: taskArr[taskNumber].B_mean_xdegree + taskArr[taskNumber].B_std_xdegree * 2
                }, // B지점 X
                {
                    drawTime: "afterDatasetsDraw", // (default)
                    type: "box",
                    mode: "horizontal",
                    yScaleID: "degree",
                    xScaleID: "timeid",
                    // value: '7.5',
                    borderColor: "rgb(255,127,0)",
                    backgroundColor: "rgba(255,127,0,0.05)",
                    borderWidth: 1,
                    xMin: taskArr[taskNumber].stabletime.B_s * 1000,
                    xMax: taskArr[taskNumber].stabletime.B_e * 1000,
                    yMin: taskArr[taskNumber].B_mean_ydegree - taskArr[taskNumber].B_std_ydegree * 2,
                    yMax: taskArr[taskNumber].B_mean_ydegree + taskArr[taskNumber].B_std_ydegree * 2
    
                }, //B지점 Y
                {
                    drawTime: "afterDatasetsDraw", // (default)
                    type: "box",
                    mode: "vertical",
                    yScaleID: "degree",
                    xScaleID: "timeid",
                    // value: '7.5',
                    borderColor: "green",
                    backgroundColor: "rgba(0,255,0,0.05)",
                    borderWidth: 1,
                    xMin: taskArr[taskNumber].startWaitTime * 1000,
                    xMax: taskArr[taskNumber].sample.startTime * 1000,
                    yMin: ymin,
                    yMax: ymax
                }, // saccade_delay
                {
                    drawTime: "afterDatasetsDraw", // (default)
                    type: "box",
                    mode: "vertical",
                    yScaleID: "degree",
                    xScaleID: "timeid",
                    // value: '7.5',
                    borderColor: "red",
                    backgroundColor: "rgba(255,0,0,0.05)",
                    borderWidth: 1,
                    xMin: taskArr[taskNumber].sample.startTime * 1000,
                    xMax: taskArr[taskNumber].sample.endTime * 1000,
                    yMin: ymin,
                    yMax: ymax
                }, // saccade_duration 
    
    
            ];
    
        }
        
        //   console.log("annotation",annotation);

        return {
            plugins: {
                datalabels: {
                    formatter: (value, ctx) => {
                        return null;
                        //return value !== 0 ? value.toLocaleString(/* ... */) : ''
                    },
                    anchor: 'center',
                    align: 'center',
                    color: '#000000'
                },
            },
            annotation: {
                events: ["click"],
                annotations: annotation,
            },
            maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio * 3,
            animation: {
                duration: 0,
            },
            tooltips: {
                callbacks: {

                    title: function (tooltipItem, data) {
                        return '';
                    }
                }
            },
            scales: {
                xAxes: [
                    {
                        id: "timeid",
                        display: true,       // 실제시간 임시로 true//
                        type: 'time',
                        time: {

                            unit: 'mything',

                            displayFormats: {
                                mything: 'ss.SSS'
                            },

                            ///////여기서조정해야함
                            // min: 0,
                            // max: 10,
                        },
                        //x축 숨기려면 이렇게
                        // gridLines: {
                        //     color: "rgba(0, 0, 0, 0)",
                        // },
                        scaleLabel: { /////////////////x축아래 라벨
                            display: true,
                            labelString: 'Time(s)',
                            fontStyle: 'bold',
                            fontColor: "black"
                        },
                        ticks: {
                            source: 'data', //auto,data,labels
                            // autoSkip: true,
                            // maxRotation: 0,
                            // major: {
                            //   enabled: true
                            // },
                            // stepSize: 10,
                            callback: function (val, index) {

                                // console.log("asfasf",val,index);
                                if (index % 60 === 0) {
                                    return (val * 1).toFixed(3);
                                }
                            }
                        }
                    }
                ],
                yAxes: [
                    {
                        id: "degree",
                        position: 'left',
                        scaleLabel: { /////////////////x축아래 라벨
                            display: true,
                            labelString: 'Position(d)',
                            fontStyle: 'bold',
                            fontColor: "black"
                        },
                        ticks: {
                            // max: 10,
                            // min: -10,

                        },
                        gridLines: {
                            color: "rgba(0, 0, 0, 0)",
                        },
                    },
                    {
                        id: "ax_blink",
                        stepSize: 1,
                        position: 'left',
                        // 오른쪽의 Fixation 옆 Blink축
                        display: false,
                        ticks: {
                            max: 1,
                        },
                        gridLines: {
                            color: "rgba(0, 0, 0, 0)",
                        },
                    }]
            },

        }
    }, [taskArr, taskNumber]);

    const [Gdata] = React.useState({
        datasets: [
            { //targetx
                data: [
                    /*
                     { x: 7, y: 0.1 },
                     { x: 50, y:0.4},
                     { x: 200, y: 0.9 },
                    */
                ],
                steppedLine: "before",
                label: "target H",
                borderColor: "rgba(0,0,255,0.4)",//"#0000ff",
                backgroundColor: 'rgba(0,0,255,0.4)',
                fill: false,
                yAxisID: "degree",
                xAxisID: "timeid",
                borderWidth: 1.5,
                pointRadius: 0.3, //데이터 포인터크기
                pointHoverRadius: 2, //hover 데이터포인터크기
            },
            { //eyex
                data: [],
                steppedLine: "before",
                label: "gaze H",
                borderColor: "rgba(0,255,0,0.7)",//"#0000ff",
                backgroundColor: 'rgba(0,255,0,0.7)',
                fill: false,
                yAxisID: "degree",
                xAxisID: "timeid",
                borderWidth: 1.5,
                pointRadius: 0.3, //데이터 포인터크기
                pointHoverRadius: 2, //hover 데이터포인터크기
            },
            { //targety
                data: [],
                steppedLine: "before",
                label: "target V",
                borderColor: "rgba(255,0,0,0.4)",//"#0000ff",
                backgroundColor: 'rgba(255,0,0,0.4)',
                fill: false,
                yAxisID: "degree",
                xAxisID: "timeid",
                borderWidth: 1.5,
                pointRadius: 0.3, //데이터 포인터크기
                pointHoverRadius: 2, //hover 데이터포인터크기
            },
            { //eyex
                data: [],
                steppedLine: "before",
                label: "gaze V",
                borderColor: "rgba(255,127,0,0.7)",//"#0000ff",
                backgroundColor: 'rgba(255,127,0,0.7)',
                fill: false,
                yAxisID: "degree",
                xAxisID: "timeid",
                borderWidth: 1.5,
                pointRadius: 0.3, //데이터 포인터크기
                pointHoverRadius: 2, //hover 데이터포인터크기
            },
            { //estimate
                data: [],
                steppedLine: "before",
                label: "fit H",
                borderColor: "rgba(112,172,143,0.65)",//"#0000ff",
                backgroundColor: 'rgba(112,172,143,0.65)',
                fill: false,
                yAxisID: "degree",
                xAxisID: "timeid",
                borderWidth: 1.5,
                pointRadius: 0.3, //데이터 포인터크기
                pointHoverRadius: 2, //hover 데이터포인터크기
            },
            { //estimate
                data: [],
                steppedLine: "before",
                label: "fit V",
                borderColor: "rgba(222,128,143,0.65)",//"#0000ff",
                backgroundColor: 'rgba(222,128,143,0.65)',
                fill: false,
                yAxisID: "degree",
                xAxisID: "timeid",
                borderWidth: 1.5,
                pointRadius: 0.3, //데이터 포인터크기
                pointHoverRadius: 2, //hover 데이터포인터크기
            },
            // {  // 깜빡임 Blink
            //     data: [
            //         /*
            //         {x:0,y:0},
            //         {x:50,y:0},
            //         {x:50,y:1},
            //         {x:50,y:0},
            //         {x:70,y:0},
            //         {x:70,y:1},
            //         {x:80,y:1}
            //         */
            //     ],
            //     steppedLine: "before",
            //     borderWidth: 0,
            //     label: "Blink",
            //     borderColor: "rgba(0,255,0,0.2)",//""#ff0000",
            //     backgroundColor: 'rgba(0,255,0,0.2)',
            //     fill: true,
            //     xAxisID: "timeid",
            //     yAxisID: "ax_blink",
            //     pointRadius: 0, //데이터 포인터크기
            //     pointHoverRadius: 0, //hover 데이터포인터크기
            // }
        ],
    });
    return (<div className="GazeViewer" ref={ref}>
        <div className="left">
            <div>
                <select value={taskNumber} onChange={e => set_taskNumber(e.target.value * 1)}>
                    {taskArr.map((task, index) => {
                        return (<option key={"task" + index} value={index}>
                            {(index + 1) + "번 task"}
                        </option>)
                    })}
                </select>
            </div>

            <div>speed
                <select value={playSpeed} onChange={e => set_playSpeed(e.target.value * 1)}>
                    <option>
                        0.1
                    </option>
                    <option>
                        0.5
                    </option>
                    <option>
                        1
                    </option>
                    <option>
                        2
                    </option>
                    <option>
                        3
                    </option>
                    <option>
                        10
                    </option>

                </select>
            </div>
            <div>
                {(nowTime * 1).toFixed(2)}/{endTime}
            </div>
            <div>
                <button onClick={handleBtnPlay}>{isPlaying ? '멈춤' : '재생'}</button>
            </div>
            <div>
                <input type="range"
                    style={{ width: '80%' }}
                    min={1} max={40} value={RPOG_SIZE} onChange={(e) => {
                        set_RPOG_SIZE(e.target.value * 1)
                    }} />
            </div>
        </div>
        <div className="right">
            <div className="viewZone" >
                <div className="viewGaze" style={{ width: '100%', height: `calc(100% - ${chartHeight}px)` }} ref={gazeRef}>
                    <div className="GC" style={{
                        width: `${data.screenW}px`,
                        height: `${data.screenH}px`,
                        transform: `scale(` + innerFrameScale + `)`,
                        top: `${innerFrameTop}px`,
                        left: `${innerFrameLeft}px`,
                        background: `${taskArr[taskNumber] && taskArr[taskNumber].backgroundColor}`
                    }}>


                        <div className="target"
                            style={{
                                width: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
                                height: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
                                background: `${taskArr[taskNumber] && taskArr[taskNumber].color}`,
                                left: targetLeft,
                                top: targetTop
                            }}
                        />

                        {
                            taskArr[taskNumber]&&(()=>{
                                // console.log("asfasf")
                                const task = taskArr[taskNumber];
                                // console.log(task);
                                if(task.type==='circular'){
                                    return (<div className="originCircle" style={{
                                        left:`${task.centerCoord.x-data.monitorInform.MONITOR_PX_PER_CM*task.distance}px`,
                                        top:`${task.centerCoord.y-data.monitorInform.MONITOR_PX_PER_CM*task.distance}px`,
                                        width:`${data.monitorInform.MONITOR_PX_PER_CM*task.distance*2}px`,
                                        height:`${data.monitorInform.MONITOR_PX_PER_CM*task.distance*2}px`,
                                    }}></div>)
                                }
                                else{
                                    return null;
                                }

                            })()
                        }
                        {
                            taskArr[taskNumber]&&(()=>{
                                // console.log("asfasf")
                                const task = taskArr[taskNumber];
                                if(!task.rotation_dataset) return null;
                                // console.log(task);
                                const xoffset_degree = task.rotation_dataset.rdxmean;
                                const yoffset_degree = task.rotation_dataset.rdymean;
                                const xoffset_cm = Math.tan(xoffset_degree*Math.PI/180)* data.defaultZ;
                                const yoffset_cm = Math.tan(yoffset_degree*Math.PI/180)* data.defaultZ;
                                const xoffset_px = xoffset_cm * data.monitorInform.MONITOR_PX_PER_CM;
                                const yoffset_px = yoffset_cm * data.monitorInform.MONITOR_PX_PER_CM;


                                const width_degree = task.rotation_dataset.mq[0] || null;
                                const height_degree = task.rotation_dataset.mq[1] || null;
                                // console.log("width_degree",width_degree);
                                const width_cm = Math.tan(width_degree*Math.PI/180)* data.defaultZ;
                                const height_cm = Math.tan(height_degree*Math.PI/180)* data.defaultZ;
                                // console.log("width_cm",width_cm);
                                const width_px = width_cm * data.monitorInform.MONITOR_PX_PER_CM;
                                const height_px = height_cm * data.monitorInform.MONITOR_PX_PER_CM;

                                if(task.type==='circular'){
                                    return (<div className="fitCircle" style={{
                                        left:`${task.centerCoord.x-width_px + xoffset_px}px`,
                                        top:`${task.centerCoord.y-height_px + yoffset_px}px`,
                                        width:`${width_px*2}px`,
                                        height:`${height_px*2}px`,
                                    }}></div>)
                                }
                                else{
                                    return null;
                                }

                            })()
                        }


                        <div className="GC-canvasWrapper" style={{ width: '100%', height: '100%' }}>
                            <canvas className="gazeCanvas"
                                width={data.screenW}
                                height={data.screenH}
                                ref={canvasRef} />
                        </div>
                    </div>
                </div>
                <div className="viewChart" style={{ width: '100%', height: `${chartHeight}px` }}>
                    <Line id="GazeChartLine"
                        data={Gdata} options={Goptions} ref={(reference) => {

                            lineChart = reference;



                        }}

                    />
                </div>
            </div>

            <div className="barZone">
                <div className="rangePlayWrapper">
                    <input className="rangePlay" type="range" step="0.01"
                        value={nowTime} max={endTime} min='0' onChange={(e) => set_nowTime((e.target.value * 1).toFixed(2))} />
                </div>

            </div>
        </div>
    </div>)
})

export default GazeViewer;
