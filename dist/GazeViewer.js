"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

require("./GazeViewer.scss");

var _lodash = _interopRequireDefault(require("lodash"));

var _reactChartjs = require("react-chartjs-2");

require("chartjs-plugin-datalabels");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var lineChart;

var GazeViewer = /*#__PURE__*/_react.default.forwardRef(function (_ref, ref) {
  var props = _extends({}, _ref);

  var data = props.data;

  var _React$useState = _react.default.useState(0),
      _React$useState2 = _slicedToArray(_React$useState, 2),
      nowTime = _React$useState2[0],
      set_nowTime = _React$useState2[1];

  var _React$useState3 = _react.default.useState(0),
      _React$useState4 = _slicedToArray(_React$useState3, 2),
      taskNumber = _React$useState4[0],
      set_taskNumber = _React$useState4[1];

  var _React$useState5 = _react.default.useState(1),
      _React$useState6 = _slicedToArray(_React$useState5, 2),
      playSpeed = _React$useState6[0],
      set_playSpeed = _React$useState6[1];

  var _React$useState7 = _react.default.useState(false),
      _React$useState8 = _slicedToArray(_React$useState7, 2),
      isPlaying = _React$useState8[0],
      set_isPlaying = _React$useState8[1];

  var gazeRef = _react.default.useRef();

  var canvasRef = _react.default.useRef();

  var _React$useState9 = _react.default.useState(0),
      _React$useState10 = _slicedToArray(_React$useState9, 2),
      innerFrameScale = _React$useState10[0],
      set_innerFrameScale = _React$useState10[1];

  var _React$useState11 = _react.default.useState(0),
      _React$useState12 = _slicedToArray(_React$useState11, 2),
      innerFrameTop = _React$useState12[0],
      set_innerFrameTop = _React$useState12[1];

  var _React$useState13 = _react.default.useState(0),
      _React$useState14 = _slicedToArray(_React$useState13, 2),
      innerFrameLeft = _React$useState14[0],
      set_innerFrameLeft = _React$useState14[1];

  var resizeInnerFrame = _react.default.useCallback(function () {
    if (!gazeRef.current) return;

    var resize100 = _lodash.default.debounce(function () {
      var pastScreenW = data.screenW;
      var pastScreenH = data.screenH; //console.log(pastScreenW + 'x' + pastScreenH);

      var pastRatio = pastScreenH / pastScreenW;
      var width = gazeRef.current.clientWidth;
      var height = gazeRef.current.clientHeight; // console.log("지금width:"+width);
      // console.log("지금height:"+height);
      //

      var nowRatio = height / width; // console.log("과거비율:" + pastRatio);
      // console.log("지금비율:" + nowRatio);
      //지금비율이 더크다는건=>지금가로가 더 작다  그말은 [높이기준]
      // 798 : x = 1920 * 1080   =>  1920*x = 1080 * 798
      //1268 지금
      //1239

      if (nowRatio >= pastRatio) {
        // console.log("지금세로가 더크다 - 가로기준 셋팅");
        set_innerFrameScale(width / pastScreenW);
        var newheight = pastScreenH * (width / pastScreenW);
        set_innerFrameTop((height - newheight) / 2);
        set_innerFrameLeft(0);
      } else {
        // console.log("지금 가로가 더 크다 (지금비율이 더 작다)-높이기준셋팅");
        set_innerFrameScale(height / pastScreenH);
        var newwidth = pastScreenW * (height / pastScreenH);
        set_innerFrameTop(0);
        set_innerFrameLeft((width - newwidth) / 2);
      }
    }, 100);

    resize100();
  }, [data]);

  var _React$useState15 = _react.default.useState(true),
      _React$useState16 = _slicedToArray(_React$useState15, 2),
      justoneTimeResizeTwice = _React$useState16[0],
      set_justoneTimeResizeTwice = _React$useState16[1];

  _react.default.useEffect(function () {
    resizeInnerFrame();
    set_taskNumber(0);
    set_nowTime(0);
    window.addEventListener('resize', resizeInnerFrame);

    if (justoneTimeResizeTwice) {
      set_justoneTimeResizeTwice(false);
      resizeInnerFrame();
    }

    return function () {
      //console.log("소멸자");
      window.removeEventListener('resize', resizeInnerFrame);
    };
  }, [resizeInnerFrame, justoneTimeResizeTwice]);

  var taskArr = _react.default.useMemo(function () {
    if (data) {
      // console.log(data);
      var newarr = [];

      for (var i = 0; i < data.screeningObjectList.length; i++) {
        var obj = _objectSpread(_objectSpread({}, data.screeningObjectList[i]), {}, {
          gazeData: data.taskArr[i]
        });

        newarr.push(obj);
      }

      var MONITOR_PX_PER_CM = data.monitorInform.MONITOR_PX_PER_CM;
      var pixel_per_cm = data.monitorInform.MONITOR_PX_PER_CM; //1cm 당 pixel

      var degree_per_cm = Math.atan(1 / data.defaultZ) * 180 / Math.PI;
      var w = data.screenW;
      var h = data.screenH; // const target_xpixel = 

      for (var _i2 = 0; _i2 < newarr.length; _i2++) {
        var task = newarr[_i2];
        var type = task.type;
        var gazeArr = task.gazeData;

        for (var j = 0; j < gazeArr.length; j++) {
          if (type === 'teleport') {
            var target_xpixel = void 0,
                target_ypixel = void 0;

            if (gazeArr[j].relTime * 1 < task.startWaitTime * 1) {
              target_xpixel = task.startCoord.x - w / 2;
              target_ypixel = task.startCoord.y - h / 2;
            } else if (gazeArr[j].relTime * 1 < task.duration * 1 + task.startWaitTime * 1) {
              target_xpixel = task.endCoord.x - w / 2;
              target_ypixel = task.endCoord.y - h / 2;
            } else {
              if (task.isReturn) {
                target_xpixel = task.startCoord.x - w / 2;
                target_ypixel = task.startCoord.y - h / 2;
              } else {
                target_xpixel = task.endCoord.x - w / 2;
                target_ypixel = task.endCoord.y - h / 2;
              }
            }

            var target_xcm = target_xpixel / pixel_per_cm;
            var target_ycm = target_ypixel / pixel_per_cm;
            var target_xdegree = target_xcm * degree_per_cm;
            var target_ydegree = target_ycm * degree_per_cm;
            gazeArr[j].target_xdegree = target_xdegree;
            gazeArr[j].target_ydegree = target_ydegree;
          } else if (type === 'circular') {
            var radian = Math.PI / 180;
            var radius = task.radius;
            var target_pixels = {
              x: null,
              y: null
            };

            if (gazeArr[j].relTime * 1 < task.startWaitTime) {
              var cosTheta = Math.cos(task.startDegree * radian);
              var sineTheta = Math.sin(task.startDegree * radian);
              target_pixels.x = task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM - w / 2;
              target_pixels.y = task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM - h / 2;
            } else if (gazeArr[j].relTime * 1 < task.duration * 1 + task.startWaitTime * 1) {
              var nowDegree = -((task.startDegree - task.endDegree) * (gazeArr[j].relTime - task.startWaitTime) / task.duration - task.startDegree);

              var _cosTheta = Math.cos(nowDegree * radian);

              var _sineTheta = Math.sin(nowDegree * radian);

              target_pixels.x = task.centerCoord.x + radius * _cosTheta * MONITOR_PX_PER_CM - w / 2;
              target_pixels.y = task.centerCoord.y - radius * _sineTheta * MONITOR_PX_PER_CM - h / 2;
            } else {
              var _cosTheta2 = Math.cos(task.endDegree * radian);

              var _sineTheta2 = Math.sin(task.endDegree * radian);

              target_pixels.x = task.centerCoord.x + radius * _cosTheta2 * MONITOR_PX_PER_CM - w / 2;
              target_pixels.y = task.centerCoord.y - radius * _sineTheta2 * MONITOR_PX_PER_CM - h / 2;
            }

            var _target_xcm = target_pixels.x / pixel_per_cm;

            var _target_ycm = target_pixels.y / pixel_per_cm;

            var _target_xdegree = _target_xcm * degree_per_cm;

            var _target_ydegree = _target_ycm * degree_per_cm;

            gazeArr[j].target_xdegree = _target_xdegree;
            gazeArr[j].target_ydegree = _target_ydegree;
          }

          if (gazeArr[j].RPOGV) {
            var xpixel = (gazeArr[j].RPOGX - 0.5) * w;
            var ypixel = (gazeArr[j].RPOGY - 0.5) * h;
            var xcm = xpixel / pixel_per_cm;
            var ycm = ypixel / pixel_per_cm;
            var xdegree = xcm * degree_per_cm;
            var ydegree = ycm * degree_per_cm;
            gazeArr[j].xdegree = xdegree;
            gazeArr[j].ydegree = ydegree;
          } else {
            gazeArr[j].xdegree = null;
            gazeArr[j].ydegree = null;
          }
        }
      }

      console.log("newarr", newarr);
      return newarr;
    } else {
      return null;
    }
  }, [data]);

  var endTime = _react.default.useMemo(function () {
    if (taskArr && taskArr[taskNumber]) {
      console.log("지금꺼정보", taskArr[taskNumber]);
      return taskArr[taskNumber].relativeEndTime.toFixed(2);
    } else {
      return null;
    }
  }, [taskArr, taskNumber]);

  var handleBtnPlay = function handleBtnPlay() {
    if (nowTime * 1 === endTime * 1) {
      set_nowTime(0);
    }

    set_isPlaying(!isPlaying);
  };

  _react.default.useEffect(function () {
    set_nowTime(0);
  }, [taskNumber]);

  _react.default.useEffect(function () {
    var myrequest;
    var startTime = Date.now();

    function timeUpdate() {
      myrequest = window.requestAnimationFrame(timeUpdate);
      var now = Date.now();
      var elapsed = now - startTime; // console.log("fps", 1000 / elapsed);

      startTime = now;
      set_nowTime(function (nt) {
        if (nt * 1 >= endTime) {
          set_isPlaying(false);
          nt = endTime;
          return nt;
        } else {
          nt = nt * 1 + elapsed / 1000 * playSpeed;
          return nt;
        }
      });
    }

    if (isPlaying === true) {
      timeUpdate();
    } else {
      window.cancelAnimationFrame(myrequest);
    }

    return function () {
      window.cancelAnimationFrame(myrequest);
    };
  }, [isPlaying, endTime, playSpeed]);

  var _React$useState17 = _react.default.useState(0),
      _React$useState18 = _slicedToArray(_React$useState17, 2),
      targetLeft = _React$useState18[0],
      set_targetLeft = _React$useState18[1];

  var _React$useState19 = _react.default.useState(0),
      _React$useState20 = _slicedToArray(_React$useState19, 2),
      targetTop = _React$useState20[0],
      set_targetTop = _React$useState20[1];

  var setTargetLocation = _react.default.useCallback(function () {
    // console.log("setTargetLocation!!")
    var task = taskArr[taskNumber];
    if (!task) return;
    var type = task.type;
    var MONITOR_PX_PER_CM = data.monitorInform.MONITOR_PX_PER_CM;

    if (type === 'teleport') {
      if (nowTime * 1 < task.startWaitTime * 1) {
        //startcoord
        set_targetLeft(task.startCoord.x + 'px');
        set_targetTop(task.startCoord.y + 'px');
      } else if (nowTime * 1 < task.duration * 1 + task.startWaitTime * 1) {
        set_targetLeft(task.endCoord.x + 'px');
        set_targetTop(task.endCoord.y + 'px');
      } else {
        //endcoord
        if (task.isReturn) {
          set_targetLeft(task.startCoord.x + 'px');
          set_targetTop(task.startCoord.y + 'px');
        } else {
          set_targetLeft(task.endCoord.x + 'px');
          set_targetTop(task.endCoord.y + 'px');
        }
      }
    } else if (type === 'circular') {
      var radian = Math.PI / 180;
      var radius = task.radius;

      if (nowTime * 1 < task.startWaitTime) {
        // console.log("첫 대기")
        var cosTheta = Math.cos(task.startDegree * radian);
        var sineTheta = Math.sin(task.startDegree * radian);
        var sc = {
          x: task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM,
          y: task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM
        };
        set_targetLeft(sc.x + 'px');
        set_targetTop(sc.y + 'px');
      } else if (nowTime * 1 < task.duration * 1 + task.startWaitTime * 1) {
        // console.log(":asfasfasfsafsafasf");
        //nowdegree
        var nowDegree = -((task.startDegree - task.endDegree) * (nowTime - task.startWaitTime) / task.duration - task.startDegree);

        var _cosTheta3 = Math.cos(nowDegree * radian);

        var _sineTheta3 = Math.sin(nowDegree * radian);

        var nc = {
          x: task.centerCoord.x + radius * _cosTheta3 * MONITOR_PX_PER_CM,
          y: task.centerCoord.y - radius * _sineTheta3 * MONITOR_PX_PER_CM
        };
        set_targetLeft(nc.x + 'px');
        set_targetTop(nc.y + 'px');
      } else {
        // console.log("마지막 0.5초")
        var _cosTheta4 = Math.cos(task.endDegree * radian);

        var _sineTheta4 = Math.sin(task.endDegree * radian);

        var ec = {
          x: task.centerCoord.x + radius * _cosTheta4 * MONITOR_PX_PER_CM,
          y: task.centerCoord.y - radius * _sineTheta4 * MONITOR_PX_PER_CM
        };
        set_targetLeft(ec.x + 'px');
        set_targetTop(ec.y + 'px');
      }
    }
  }, [nowTime, taskArr, taskNumber, data]);

  var _React$useState21 = _react.default.useState(3),
      _React$useState22 = _slicedToArray(_React$useState21, 2),
      RPOG_SIZE = _React$useState22[0],
      set_RPOG_SIZE = _React$useState22[1];

  var drawGaze = _react.default.useCallback(function () {
    var task = taskArr[taskNumber];
    if (!task) return;
    var gazeArr = task.gazeData;
    var w = data.screenW;
    var h = data.screenH; // console.log("w",w);

    var RPOGSIZE = RPOG_SIZE;
    var canvas = canvasRef.current;
    var rctx = canvas.getContext('2d');
    rctx.clearRect(0, 0, w, h); // console.log("drawGaze 호출")

    for (var i = 0; i < gazeArr.length; i++) {
      if (gazeArr[i].relTime <= nowTime * 1 && gazeArr[i].RPOGV) {
        // console.log("야 여기당");
        rctx.beginPath();
        rctx.lineWidth = 0.5;
        rctx.strokeStyle = 'rgb(255,0,0,0.3)';
        rctx.fillStyle = 'rgb(255,0,0,0.3)'; // let x = (gazeArr[i].RPOGX) * w;
        // let y = (gazeArr[i].RPOGY) * h;
        // console.log("x,y",x,y);

        rctx.arc(gazeArr[i].RPOGX * w, gazeArr[i].RPOGY * h, RPOGSIZE, 0, Math.PI * 2);
        rctx.fill();
        rctx.stroke(); //그려
      }
    }
  }, [nowTime, taskArr, taskNumber, data, RPOG_SIZE]);

  var drawChart = _react.default.useCallback(function () {
    var task = taskArr[taskNumber];
    if (!task) return; // const pixel_per_cm = data.monitorInform.MONITOR_PX_PER_CM; //1cm 당 pixel
    // const degree_per_cm = Math.atan(1 / data.defaultZ) * 180 / Math.PI;
    // const w = data.screenW;
    // const h = data.screenH;

    var gazeArr = task.gazeData;
    var Gdata = {
      target_x: [],
      target_y: [],
      eye_x: [],
      eye_y: []
    }; // console.log("gazeArr",gazeArr);

    for (var i = 0; i < gazeArr.length; i++) {
      if (gazeArr[i].relTime <= nowTime * 1 && gazeArr[i].RPOGV) {
        // console.log("gazeArr[i].target_xdegree?",gazeArr[i]);
        // console.log("target_xdegree:",gazeArr[i].target_xdegree)
        var target_xdata = {
          x: gazeArr[i].relTime * 1000,
          y: gazeArr[i].target_xdegree ? gazeArr[i].target_xdegree : 0
        };
        var target_ydata = {
          x: gazeArr[i].relTime * 1000,
          y: gazeArr[i].target_ydegree ? gazeArr[i].target_ydegree : 0
        };
        var eye_xdata = {
          x: gazeArr[i].relTime * 1000,
          y: gazeArr[i].xdegree ? gazeArr[i].xdegree : 0
        };
        var eye_ydata = {
          x: gazeArr[i].relTime * 1000,
          y: gazeArr[i].ydegree ? gazeArr[i].ydegree : 0
        };
        Gdata.target_x.push(target_xdata);
        Gdata.target_y.push(target_ydata);
        Gdata.eye_x.push(eye_xdata);
        Gdata.eye_y.push(eye_ydata);
      }
    } // let lasttarget_xdata={
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

  _react.default.useEffect(function () {
    drawChart();
  }, [drawChart]);

  _react.default.useEffect(function () {
    setTargetLocation();
    drawGaze();
  }, [setTargetLocation, drawGaze]);

  var _React$useState23 = _react.default.useState('250'),
      _React$useState24 = _slicedToArray(_React$useState23, 1),
      chartHeight = _React$useState24[0];

  var _React$useState25 = _react.default.useState({
    plugins: {
      datalabels: {
        formatter: function formatter(value, ctx) {
          return null; //return value !== 0 ? value.toLocaleString(/* ... */) : ''
        },
        anchor: 'center',
        align: 'center',
        color: '#000000'
      }
    },
    maintainAspectRatio: false,
    devicePixelRatio: window.devicePixelRatio * 3,
    animation: {
      duration: 0
    },
    tooltips: {
      callbacks: {
        title: function title(tooltipItem, data) {
          return '';
        }
      }
    },
    scales: {
      xAxes: [{
        id: "timeid",
        display: true,
        // 실제시간 임시로 true//
        type: 'time',
        time: {
          unit: 'mything',
          displayFormats: {
            mything: 'ss.SSS'
          } ///////여기서조정해야함
          // min: 0,
          // max: 10,

        },
        //x축 숨기려면 이렇게
        // gridLines: {
        //     color: "rgba(0, 0, 0, 0)",
        // },
        scaleLabel: {
          /////////////////x축아래 라벨
          display: true,
          labelString: 'Time(s)',
          fontStyle: 'bold',
          fontColor: "black"
        },
        ticks: {
          source: 'data',
          //auto,data,labels
          // autoSkip: true,
          // maxRotation: 0,
          // major: {
          //   enabled: true
          // },
          // stepSize: 10,
          callback: function callback(val, index) {
            // console.log("asfasf",val,index);
            if (index % 60 === 0) {
              return (val * 1).toFixed(3);
            }
          }
        }
      }],
      yAxes: [{
        id: "degree",
        position: 'left',
        scaleLabel: {
          /////////////////x축아래 라벨
          display: true,
          labelString: 'Position(d)',
          fontStyle: 'bold',
          fontColor: "black"
        },
        ticks: {// max: 10,
          // min: -10,
        },
        gridLines: {
          color: "rgba(0, 0, 0, 0)"
        }
      }, {
        id: "ax_blink",
        stepSize: 1,
        position: 'left',
        // 오른쪽의 Fixation 옆 Blink축
        display: false,
        ticks: {
          max: 1
        },
        gridLines: {
          color: "rgba(0, 0, 0, 0)"
        }
      }]
    }
  }),
      _React$useState26 = _slicedToArray(_React$useState25, 1),
      Goptions = _React$useState26[0];

  var _React$useState27 = _react.default.useState({
    datasets: [{
      //targetx
      data: [
        /*
         { x: 7, y: 0.1 },
         { x: 50, y:0.4},
         { x: 200, y: 0.9 },
        */
      ],
      steppedLine: "before",
      label: "target H",
      borderColor: "rgba(0,0,255,0.4)",
      //"#0000ff",
      backgroundColor: 'rgba(0,0,255,0.4)',
      fill: false,
      yAxisID: "degree",
      xAxisID: "timeid",
      borderWidth: 1.5,
      pointRadius: 0.3,
      //데이터 포인터크기
      pointHoverRadius: 2 //hover 데이터포인터크기

    }, {
      //eyex
      data: [],
      steppedLine: "before",
      label: "gaze H",
      borderColor: "rgba(0,255,0,0.7)",
      //"#0000ff",
      backgroundColor: 'rgba(0,255,0,0.7)',
      fill: false,
      yAxisID: "degree",
      xAxisID: "timeid",
      borderWidth: 1.5,
      pointRadius: 0.3,
      //데이터 포인터크기
      pointHoverRadius: 2 //hover 데이터포인터크기

    }, {
      //targety
      data: [],
      steppedLine: "before",
      label: "target V",
      borderColor: "rgba(255,0,0,0.4)",
      //"#0000ff",
      backgroundColor: 'rgba(255,0,0,0.4)',
      fill: false,
      yAxisID: "degree",
      xAxisID: "timeid",
      borderWidth: 1.5,
      pointRadius: 0.3,
      //데이터 포인터크기
      pointHoverRadius: 2 //hover 데이터포인터크기

    }, {
      //eyex
      data: [],
      steppedLine: "before",
      label: "gaze V",
      borderColor: "rgba(255,127,0,0.7)",
      //"#0000ff",
      backgroundColor: 'rgba(255,127,0,0.7)',
      fill: false,
      yAxisID: "degree",
      xAxisID: "timeid",
      borderWidth: 1.5,
      pointRadius: 0.3,
      //데이터 포인터크기
      pointHoverRadius: 2 //hover 데이터포인터크기

    } // {  // 깜빡임 Blink
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
    ]
  }),
      _React$useState28 = _slicedToArray(_React$useState27, 1),
      Gdata = _React$useState28[0];

  return /*#__PURE__*/_react.default.createElement("div", {
    className: "GazeViewer",
    ref: ref
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "left"
  }, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("select", {
    value: taskNumber,
    onChange: function onChange(e) {
      return set_taskNumber(e.target.value * 1);
    }
  }, taskArr.map(function (task, index) {
    return /*#__PURE__*/_react.default.createElement("option", {
      key: "task" + index,
      value: index
    }, index + 1 + "th task");
  }))), /*#__PURE__*/_react.default.createElement("div", null, "speed", /*#__PURE__*/_react.default.createElement("select", {
    value: playSpeed,
    onChange: function onChange(e) {
      return set_playSpeed(e.target.value * 1);
    }
  }, /*#__PURE__*/_react.default.createElement("option", null, "0.1"), /*#__PURE__*/_react.default.createElement("option", null, "0.5"), /*#__PURE__*/_react.default.createElement("option", null, "1"), /*#__PURE__*/_react.default.createElement("option", null, "2"), /*#__PURE__*/_react.default.createElement("option", null, "3"), /*#__PURE__*/_react.default.createElement("option", null, "10"))), /*#__PURE__*/_react.default.createElement("div", null, (nowTime * 1).toFixed(2), "/", endTime), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("button", {
    onClick: handleBtnPlay
  }, isPlaying ? '멈춤' : '재생')), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("input", {
    type: "range",
    style: {
      width: '80%'
    },
    min: 1,
    max: 40,
    value: RPOG_SIZE,
    onChange: function onChange(e) {
      set_RPOG_SIZE(e.target.value * 1);
    }
  }))), /*#__PURE__*/_react.default.createElement("div", {
    className: "right"
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "viewZone"
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "viewGaze",
    style: {
      width: '100%',
      height: "calc(100% - ".concat(chartHeight, "px)")
    },
    ref: gazeRef
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "GC",
    style: {
      width: "".concat(data.screenW, "px"),
      height: "".concat(data.screenH, "px"),
      transform: "scale(" + innerFrameScale + ")",
      top: "".concat(innerFrameTop, "px"),
      left: "".concat(innerFrameLeft, "px"),
      background: "".concat(taskArr[taskNumber] && taskArr[taskNumber].backgroundColor)
    }
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "target",
    style: {
      width: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
      height: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
      background: "".concat(taskArr[taskNumber] && taskArr[taskNumber].color),
      left: targetLeft,
      top: targetTop
    }
  }), /*#__PURE__*/_react.default.createElement("div", {
    className: "GC-canvasWrapper",
    style: {
      width: '100%',
      height: '100%'
    }
  }, /*#__PURE__*/_react.default.createElement("canvas", {
    className: "gazeCanvas",
    width: data.screenW,
    height: data.screenH,
    ref: canvasRef
  })))), /*#__PURE__*/_react.default.createElement("div", {
    className: "viewChart",
    style: {
      width: '100%',
      height: "".concat(chartHeight, "px")
    }
  }, /*#__PURE__*/_react.default.createElement(_reactChartjs.Line, {
    id: "GazeChartLine",
    data: Gdata,
    options: Goptions,
    ref: function ref(reference) {
      lineChart = reference;
    }
  }))), /*#__PURE__*/_react.default.createElement("div", {
    className: "barZone"
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "rangePlayWrapper"
  }, /*#__PURE__*/_react.default.createElement("input", {
    className: "rangePlay",
    type: "range",
    step: "0.01",
    value: nowTime,
    max: endTime,
    min: "0",
    onChange: function onChange(e) {
      return set_nowTime((e.target.value * 1).toFixed(2));
    }
  })))));
});

var _default = GazeViewer;
exports.default = _default;