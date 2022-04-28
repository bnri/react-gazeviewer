import React from "react";
import './GazeViewer.scss';
import _ from 'lodash';
import { Line } from "react-chartjs-2"
import 'chartjs-plugin-datalabels';

let lineChart;

const GazeViewer = React.forwardRef(({ ...props }, ref) => {
    const { data } = props;

    const [nowTime, set_nowTime] = React.useState(0);
    const [taskNumber, set_taskNumber] = React.useState(0);
    const [playSpeed, set_playSpeed] = React.useState(1);
    const [playFrame, set_playFrame] = React.useState(60); //frame per sec

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


            // const target_xpixel = 

     

            for (let i = 0; i < newarr.length; i++) {
                const task = newarr[i];
           
                const type = task.type;


                let gazeArr = task.gazeData;
                for (let j = 0; j < gazeArr.length; j++) {

                    if (type === 'teleport') {
                        let target_xpixel,target_ypixel;
                        if(gazeArr[j].relTime*1 < task.startWaitTime*1){
                            target_xpixel=task.startCoord.x - w/2;
                            target_ypixel=task.startCoord.y - h/2;
                       
                        }
                        else if (gazeArr[j].relTime * 1 < (task.duration * 1 + task.startWaitTime * 1)) {
                            target_xpixel=task.endCoord.x - w/2;
                            target_ypixel=task.endCoord.y- h/2;
                        }
                        else{
                            if(task.isReturn){
                                target_xpixel=task.startCoord.x - w/2;
                                target_ypixel=task.startCoord.y- h/2;
                            }
                            else{
                                target_xpixel=task.endCoord.x - w/2;
                                target_ypixel=task.endCoord.y- h/2;
                            }

                        }
                        let target_xcm = target_xpixel / pixel_per_cm;
                        let target_ycm = target_ypixel / pixel_per_cm;
                        let target_xdegree = target_xcm * degree_per_cm;
                        let target_ydegree = target_ycm * degree_per_cm;
                        gazeArr[j].target_xdegree = target_xdegree;
                        gazeArr[j].target_ydegree = target_ydegree;
                    }
                    else if (type === 'circular') {
                
                        const radian = Math.PI / 180;
                        const radius = task.radius;
                        let target_pixels = {
                            x:null,
                            y:null,
                        }
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
                        gazeArr[j].xdegree = xdegree;
                        gazeArr[j].ydegree = ydegree;
                    }
                    else {
                        gazeArr[j].xdegree = null;
                        gazeArr[j].ydegree = null;
                    }

                }

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
        let interval;

        if (isPlaying === true) {
            interval = setInterval(function () {
                set_nowTime((nt) => {

                    if (nt * 1 >= endTime) {

                        set_isPlaying(false);
                        nt = endTime;
                        return nt;
                    }
                    else {
                        nt = nt * 1 + (1 / playFrame * playSpeed)
                        return nt;
                    }
                });
            }, 1000 / playFrame); //프레임 //0.1초마다 얼마큼씩 시간을 증가시킬거냐로

        }
        else {
            clearInterval(interval);
        }


        return () => {
            clearInterval(interval);
        }
    }, [isPlaying, endTime, playFrame, playSpeed]);




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

    const drawChart = React.useCallback(() => {
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
                lineChart.chartInstance.update();
            
        }

    }, [nowTime, taskArr, taskNumber]);

    React.useEffect(() => {
        setTargetLocation();
        drawGaze();
        drawChart();
    }, [nowTime, setTargetLocation, drawGaze, drawChart])



    const [chartHeight, set_chartHeight] = React.useState('150');


    const [Goptions] = React.useState({
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
                    display: false,       // 실제시간 임시로 true//
                    type: 'time',
                    time: {

                        unit: 'mything',

                        displayFormats: {
                            mything: 'ss.SS'
                        },

                        ///////여기서조정해야함
                        //min: 4,
                        //max: 10,

                    },
                    gridLines: {
                        color: "rgba(0, 0, 0, 0)",
                    },
                    ticks: {
                        source: 'data', //auto,data,labels
                    }
                }
            ],
            yAxes: [
                {
                    id: "degree",
                    position: 'left',
                    scaleLabel: { /////////////////x축아래 라벨
                        display: true,
                        labelString: '각도',
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

    });
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
                label: "target_X",
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
                label: "eye_X",
                borderColor: "rgba(255,0,0,0.7)",//"#0000ff",
                backgroundColor: 'rgba(255,0,0,0.7)',
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
                label: "target_Y",
                borderColor: "rgba(255,255,0,0.4)",//"#0000ff",
                backgroundColor: 'rgba(255,255,0,0.4)',
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
                label: "eye_Y",
                borderColor: "rgba(255,127,0,0.7)",//"#0000ff",
                backgroundColor: 'rgba(255,127,0,0.7)',
                fill: false,
                yAxisID: "degree",
                xAxisID: "timeid",
                borderWidth: 1.5,
                pointRadius: 0.3, //데이터 포인터크기
                pointHoverRadius: 2, //hover 데이터포인터크기
            },
            {  // 깜빡임 Blink
                data: [
                    /*
                    {x:0,y:0},
                    {x:50,y:0},
                    {x:50,y:1},
                    {x:50,y:0},
                    {x:70,y:0},
                    {x:70,y:1},
                    {x:80,y:1}
                    */
                ],
                steppedLine: "before",
                borderWidth: 0,
                label: "Blink",
                borderColor: "rgba(0,255,0,0.2)",//""#ff0000",
                backgroundColor: 'rgba(0,255,0,0.2)',
                fill: true,
                xAxisID: "timeid",
                yAxisID: "ax_blink",
                pointRadius: 0, //데이터 포인터크기
                pointHoverRadius: 0, //hover 데이터포인터크기
            }
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
            <div>frame
                <select value={playFrame} onChange={e => set_playFrame(e.target.value * 1)}>
                    <option>
                        10
                    </option>
                    <option>
                        20
                    </option>
                    <option>
                        30
                    </option>
                    <option>
                        60
                    </option>
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
