import React from "react";
import './GazeViewer.scss';
import _ from 'lodash';
import { Line } from "react-chartjs-2"
import "chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js";
import "chartjs-plugin-datalabels";
import "chartjs-plugin-annotation";
import regression from 'regression';
import {mean,std,
    // atan2, chain, derivative, e, evaluate, log, pi, pow, round, sqrt
  } from 'mathjs'
// console.log(mean);
// console.log(std);
  // console.log(math);
// console.log(regression);

//https://stackoverflow.com/questions/16716302/how-do-i-fit-a-sine-curve-to-my-data-with-pylab-and-numpy


//그나마 찾은 ㄱㅊ은것.. 머신러닝임 마찬가지로
//https://github.com/mljs/levenberg-marquardt


//advanced regression 모듈 우리꺼에 추가할것..
var prepare_for_MathJax = function(string) {
    // Prepare the formula string for MathJax, LaTeX style formula.
    // Add $$ before and after string, replace 'e' notation with '10^'
    // and remove redundant '+' in case it is directly followed by '-'.
    return '\\(' + string.replace(/e\+?(-?\d+)/g,'\\cdot10^{$1}')
                        .replace(/\+ -/g, '-') + '\\)';
};

const sineRegression = (data,period)=>{
      // Sine regression. With a guessed value for the period p
            // the function Sum((A*sin(2*pi*x/p + c) - y*)^2) is
            // mimimized, where y* = y - <y>. Correlation coefficient is
            // calculated according to r^2 = 1 - SSE/SST, where SSE is
            // the sum of the squared deviations of y-data with respect
            // to y-regression and where SST is the sum of the
            // deviations of y-data with respect to the mean of y-data.
            
            if (typeof period === 'undefined') {
                period = data[data.length - 1][0] - data[0][0];}

            var sum = [0, 0, 0, 0, 0, 0, 0, 0, 0],
                b = 2 * Math.PI / period,
                x, bx, y, yf, i, n, cos, sin,
                results = [];

            for (i = 0; i < data.length; i++) {
                x = data[i][0];
                y = data[i][1];
                bx = b * x;
                cos = Math.cos(bx);
                sin = Math.sin(bx);
                sum[0] += cos * cos;
                sum[1] += cos * sin;
                sum[2] += sin * sin;
                sum[3] += y * cos;
                sum[4] += y * sin;
                sum[5] += 1;
                sum[6] += cos;
                sum[7] += sin;
                sum[8] += y;}

            n = sum[5];
            var termss = sum[2] - sum[7] * sum[7] / n;
            var termsc = sum[1] - sum[6] * sum[7] / n;
            var termcc = sum[0] - sum[6] * sum[6] / n;
            var termys = sum[4] - sum[8] * sum[7] / n;
            var termyc = sum[3] - sum[8] * sum[6] / n;

            var termA = termcc * termys - termsc * termyc;
            var termB = termss * termyc - termsc * termys;
            var termC = termss * termcc - termsc * termsc;

            var sqAB = termA * termA + termB * termB;
            var sqB = termB * termB;
            var ratio = sqB / sqAB;
            var a = Math.sqrt(sqAB * sqB) / termC / termB;
            var c = Math.atan2(ratio, ratio * termA / termB);
            if (a < 0) {
                a = - a;
                c = c + Math.PI;}
            if (c < 0) {
                c += 2 * Math.PI;}

            var SSE = 0, SST = 0;
            var d = (sum[8] - a * Math.cos(c) * sum[7] - a * Math.sin(c) * sum[6]) / n;
            var yg = sum[8] / n;
            for (i = 0; i < data.length; i++) {
                x = data[i][0];
                y = data[i][1];
                yf = a * Math.sin(2 * Math.PI * x / period + c) + d;
                SSE += (y - yf) * (y - yf);
                SST += (y - yg) * (y - yg);}

            for (i = 0; i < data.length; i++) {
                x = data[i][0];
                yf = a * Math.sin(2 * Math.PI * x / period + c) + d;
                var coordinate = [x, yf];
                results.push(coordinate);}

            var corr = Math.sqrt(1 - SSE / SST) * Math.sqrt(1 - SSE / SST);
            var corrstring = 'r^2 = ' + corr.toFixed(3);
            var string = 'y = ' + a.toExponential(2) +
                         '\\cdot \\sin \\left( \\frac{2 \\pi}{' +
                         period.toExponential(2) + '} \\cdot x + ' +
                         c.toExponential(2) + ' \\right) + ' +
                         d.toExponential(2);

            return {equation: [a, c], points: results,
                    string: prepare_for_MathJax(string),
                    corrstring: prepare_for_MathJax(corrstring)};
}

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
        set_taskNumber(0);
        set_nowTime(0);

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
            // console.log(data);
            let newarr = [];
            for (let i = 0; i < data.screeningObjectList.length; i++) {



                let obj = {
                    ...data.screeningObjectList[i],
                    gazeData: data.taskArr[i]
                };
                newarr.push(obj);
            }


            const MONITOR_PX_PER_CM = data.monitorInform.MONITOR_PX_PER_CM;
            const pixel_per_cm = data.monitorInform.MONITOR_PX_PER_CM; //1cm 당 pixel
            const degree_per_cm = Math.atan(1 / data.defaultZ) * 180 / Math.PI;
            const w = data.screenW;
            const h = data.screenH;


     

            for (let i = 0; i < newarr.length; i++) {
                const task = newarr[i];
           
                const type = task.type;


                let gazeArr = task.gazeData;
                for (let j = 0; j < gazeArr.length; j++) {
                    let target_pixels = {
                        x:null,
                        y:null,
                    }
                    if (type === 'teleport') {
                        //2~5 고정임

                        if(gazeArr[j].relTime*1 < task.startWaitTime*1){
                            target_pixels.x=task.startCoord.x - w/2;
                            target_pixels.y=task.startCoord.y - h/2;
                       
                        }
                        else if (gazeArr[j].relTime * 1 < (task.duration * 1 + task.startWaitTime * 1)) {
                            target_pixels.x=task.endCoord.x - w/2;
                            target_pixels.y=task.endCoord.y- h/2;
                        }
                        else{
                            if(task.isReturn){
                                target_pixels.x=task.startCoord.x - w/2;
                                target_pixels.y=task.startCoord.y- h/2;
                            }
                            else{
                                target_pixels.x=task.endCoord.x - w/2;
                                target_pixels.y=task.endCoord.y- h/2;
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
                            target_pixels.x=task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM- w/2;
                            target_pixels.y= task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM- h/2;
                            
                        }
                        else if (gazeArr[j].relTime * 1 < (task.duration * 1 + task.startWaitTime * 1)) {
                            let nowDegree = -((task.startDegree - task.endDegree) * 
                            (gazeArr[j].relTime - task.startWaitTime) / task.duration - task.startDegree);
                            const cosTheta = Math.cos(nowDegree * radian);
                            const sineTheta = Math.sin(nowDegree * radian);
                            target_pixels.x=task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM- w/2;
                            target_pixels.y=task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM- h/2;
                        }
                        else {
                            const cosTheta = Math.cos(task.endDegree * radian);
                            const sineTheta = Math.sin(task.endDegree * radian);
                            target_pixels.x=task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM- w/2;
                            target_pixels.y=task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM- h/2;

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
                        let diff_xdegree = gazeArr[j].target_xdegree - xdegree;
                        let diff_ydegree = gazeArr[j].target_ydegree - ydegree;
                        gazeArr[j].xdegree = xdegree;
                        gazeArr[j].ydegree = ydegree;
                        gazeArr[j].diff_xdegree = diff_xdegree;
                        gazeArr[j].diff_ydegree = diff_ydegree;
                    }
                    else {
                        gazeArr[j].xdegree = null;
                        gazeArr[j].ydegree = null;
                        gazeArr[j].diff_xdegree = null;
                        gazeArr[j].diff_ydegree = null;
                    }

                }


              

                let diff_xdegree_arr=[];
                let diff_ydegree_arr=[];
                let diff_xdegree_linear_arr = [];
                let diff_xdegree_polynomial_arr = [];

                for (let j = 0; j < gazeArr.length; j++) {
                    if (type === 'teleport') {
                        if(gazeArr[j].relTime*1 >= 1 &&
                            gazeArr[j].relTime*1 <= task.startWaitTime*1){
                            
                                if(gazeArr[j].diff_xdegree!==null){
                                    diff_xdegree_arr.push(Math.abs(gazeArr[j].diff_xdegree));
                                    // diff_xdegree_linear_arr.push([gazeArr[j].relTime,gazeArr[j].diff_xdegree]);
                                }
                                if(gazeArr[j].diff_ydegree!==null){
                                    diff_ydegree_arr.push(Math.abs(gazeArr[j].diff_ydegree));
                                }
                        }

                        if(gazeArr[j].relTime*1 >= 0 &&
                            gazeArr[j].relTime*1 <= task.startWaitTime*1){
                                diff_xdegree_linear_arr.push([gazeArr[j].relTime,gazeArr[j].diff_xdegree]);
                        }

                    }
                    else if(type==='circular'){
                        if(gazeArr[j].relTime*1 >= task.startWaitTime*1 &&
                            gazeArr[j].relTime*1 <= (task.startWaitTime*1 + task.duration*1) ){
                            diff_xdegree_polynomial_arr.push([gazeArr[j].relTime,gazeArr[j].diff_xdegree]);
                        }
                    }
                }
                task.diff_xdegree_arr= diff_xdegree_arr;
                task.diff_ydegree_arr = diff_ydegree_arr;
                task.mean_diff_xdegree = (diff_xdegree_arr.length && mean(diff_xdegree_arr)) || null;
                task.mean_diff_ydegree = (diff_ydegree_arr.length && mean(diff_ydegree_arr)) || null;
                task.std_diff_xdegree = (diff_xdegree_arr.length && std(diff_xdegree_arr)) || null;
                task.std_diff_ydegree = (diff_ydegree_arr.length && std(diff_ydegree_arr)) || null;
                

                task.stabletime = {
                    s:1,
                    e:task.startWaitTime*1,
                    sx_index:null,
                    ex_index:null,                   
                    sy_index:null,
                    ey_index:null 
                }

                diff_xdegree_arr=[];
                diff_ydegree_arr=[];
                //1.5 +- 표준편차 사이
              
                for (let j = 0; j < gazeArr.length; j++) {
                    if (type === 'teleport') {
                        if(gazeArr[j].relTime*1 >= 1 &&
                            gazeArr[j].relTime*1 <= task.startWaitTime*1){
                            
                                if(gazeArr[j].diff_xdegree!==null){
                                    if(Math.abs(gazeArr[j].diff_xdegree)<1.5*task.std_diff_xdegree){
                                        // diff_xdegree_arr.push(gazeArr[j].diff_xdegree);
                                        gazeArr[j].valid_xdiff = true;
                                        if(!task.stabletime.sx_index){
                                            task.stabletime.sx_index=j;
                                        }
                                        task.stabletime.ex_index=j;

                                       
                                    }
                                    else{
                                        gazeArr[j].valid_xdiff = false;
                                    }

                                }
                                if(gazeArr[j].diff_ydegree!==null){
                                    if(Math.abs(gazeArr[j].diff_ydegree)<1.5*task.std_diff_ydegree){
                                        // diff_ydegree_arr.push(gazeArr[j].diff_ydegree);
                                        gazeArr[j].valid_ydiff = true;
                                        if(!task.stabletime.sy_index){
                                            task.stabletime.sy_index=j;
                                        }
                                        task.stabletime.ey_index=j;
                                    }
                                    else{
                                        gazeArr[j].valid_ydiff = false;
                                    }
                                }
                        }
                    }
                }
                if(task.type==='teleport'){
                    task.diff_xdegree_linear_arr = diff_xdegree_linear_arr;
                    let result=regression.linear(diff_xdegree_linear_arr);
                    task.res_diff_xdegree_linear_arr=result;
                }
                else if(task.type==='circular'){
               
                    task.diff_xdegree_polynomial_arr = diff_xdegree_polynomial_arr;
                    // let result=sineRegression(diff_xdegree_polynomial_arr,task.duration);
                    let result=regression.polynomial(diff_xdegree_polynomial_arr,{ order : 5, precision: 2 });
                    task.res_diff_xdegree_polynomial_arr=result;
                }




                //teleport의 경우
                //1초부터 ~ startWaitTime 전까지의 평균 diff degree
                //std 를 구해서
                //1.5std 밖에 있는녀석을 제외하고, 평균을 다시 구하고
                //
            }

            console.log("newarr", newarr);
            return newarr;
        }
        else {
            return null;
        }
    }, [data]);

    const endTime = React.useMemo(() => {
        if (taskArr && taskArr[taskNumber]) {
            console.log("지금꺼정보", taskArr[taskNumber]);

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
        set_nowTime(0);
    }, [taskNumber])

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
        if (type === 'teleport') {
            if (nowTime * 1 < task.startWaitTime * 1) {
                //startcoord
                set_targetLeft(task.startCoord.x + 'px');
                set_targetTop(task.startCoord.y + 'px');
            }
            else if (nowTime * 1 < (task.duration * 1 + task.startWaitTime * 1)) {
                set_targetLeft(task.endCoord.x + 'px');
                set_targetTop(task.endCoord.y + 'px');
            }
            else {
                //endcoord
                if(task.isReturn){
                    set_targetLeft(task.startCoord.x + 'px');
                    set_targetTop(task.startCoord.y + 'px');
                }
                else{
                    set_targetLeft(task.endCoord.x + 'px');
                    set_targetTop(task.endCoord.y + 'px');
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
                    x: task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM,
                    y: task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM
                }
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
                    x: task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM,
                    y: task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM
                }
                set_targetLeft(nc.x + 'px');
                set_targetTop(nc.y + 'px');
            }
            else {
                // console.log("마지막 0.5초")
                const cosTheta = Math.cos(task.endDegree * radian);
                const sineTheta = Math.sin(task.endDegree * radian);
                let ec = {
                    x: task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM,
                    y: task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM
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
    

    const drawChart = React.useCallback(()=> {
      
            const task = taskArr[taskNumber];
            if (!task) return;
            // const pixel_per_cm = data.monitorInform.MONITOR_PX_PER_CM; //1cm 당 pixel
            // const degree_per_cm = Math.atan(1 / data.defaultZ) * 180 / Math.PI;
            // const w = data.screenW;
            // const h = data.screenH;
            let gazeArr = task.gazeData;
            
     


            let Gdata={
                target_x:[],
                target_y:[],
                eye_x:[],
                eye_y:[],
 
            }
            // console.log("gazeArr",gazeArr);
            for (let i = 0; i < gazeArr.length; i++) {
                if (gazeArr[i].relTime <= nowTime * 1 && gazeArr[i].RPOGV) {
                    // console.log("gazeArr[i].target_xdegree?",gazeArr[i]);
                    // console.log("target_xdegree:",gazeArr[i].target_xdegree)
                    let target_xdata={
                        x:gazeArr[i].relTime*1000,
                        y:gazeArr[i].target_xdegree?gazeArr[i].target_xdegree:0
                    }
                    let target_ydata={
                        x:gazeArr[i].relTime*1000,
                        y:gazeArr[i].target_ydegree?gazeArr[i].target_ydegree:0
                    }
                    let eye_xdata={
                        x:gazeArr[i].relTime*1000,
                        y:gazeArr[i].xdegree?gazeArr[i].xdegree:0
                    }
                    let eye_ydata={
                        x:gazeArr[i].relTime*1000,
                        y:gazeArr[i].ydegree?gazeArr[i].ydegree:0
                    }

                
                
                    Gdata.target_x.push(target_xdata);
                    Gdata.target_y.push(target_ydata);
                    Gdata.eye_x.push(eye_xdata);
                    Gdata.eye_y.push(eye_ydata);
             

                }
            }
    
            // let lasttarget_xdata={
            //     x:gazeArr[gazeArr.length-1].relTime*1000,
            //     y:gazeArr[gazeArr.length-1].target_xdegree?gazeArr[gazeArr.length-1].target_xdegree:0
            // }
    
            // Gdata.target_x.push(lasttarget_xdata);
     
    
    
            if (lineChart) {
                // console.log("Gdata.target_x",Gdata.target_x);
                    lineChart.chartInstance.data.datasets[0].data = Gdata.target_x;     
                    lineChart.chartInstance.data.datasets[1].data = Gdata.eye_x;     
                    lineChart.chartInstance.data.datasets[2].data = Gdata.target_y;     
                    lineChart.chartInstance.data.datasets[3].data = Gdata.eye_y;  

                    // if(equation){
                    //     lineChart.chartInstance.data.datasets[4].data = Gdata.estimate;  
                    // }
                    lineChart.chartInstance.update();
                
            }
    },[nowTime, taskArr, taskNumber]);



    React.useEffect(()=>{
        drawChart();
    },[drawChart]);

    React.useEffect(() => {
        setTargetLocation();
        drawGaze();
    }, [setTargetLocation, drawGaze])



    const [chartHeight] = React.useState('250');


    const Goptions = React.useMemo(()=>{

        console.log(taskArr[taskNumber]);
        //95% 신뢰구간 1.96
        // 99% 신뢰구간 2.58

        // std * 1.96 / 루트(모집단수)


        const annotation=[{
            drawTime: "afterDatasetsDraw", // (default)
            type: "box",
            mode: "horizontal",
            yScaleID: "degree",
            xScaleID: "timeid",
            // value: '7.5',
            borderColor: "green",
            backgroundColor: "rgba(0,255,0,0.05)",
            borderWidth: 1,
            xMin : taskArr[taskNumber].stabletime.s*1000,
            xMax : taskArr[taskNumber].stabletime.e*1000,
            yMin : -taskArr[taskNumber].std_diff_xdegree*5,
            yMax : taskArr[taskNumber].std_diff_xdegree*5
          },{
            drawTime: "afterDatasetsDraw", // (default)
            type: "box",
            mode: "horizontal",
            yScaleID: "degree",
            xScaleID: "timeid",
            // value: '7.5',
            borderColor: "rgb(255,127,0)",
            backgroundColor: "rgba(255,127,0,0.05)",
            borderWidth: 1,
            xMin : taskArr[taskNumber].stabletime.s*1000,
            xMax : taskArr[taskNumber].stabletime.e*1000,
            yMin : -taskArr[taskNumber].std_diff_ydegree*5,
            yMax : taskArr[taskNumber].std_diff_ydegree*5

          }];
        
          console.log("annotation",annotation);

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
                        callback:function(val,index){

                            // console.log("asfasf",val,index);
                            if(index%60===0){
                                return (val*1).toFixed(3);
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

    }},[taskArr,taskNumber]);

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
                label: "estimate",
                borderColor: "rgba(255,255,0,0.7)",//"#0000ff",
                backgroundColor: 'rgba(255,255,0,0.7)',
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
                            {(index + 1) + "th task"}
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
