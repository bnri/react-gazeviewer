"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

require("./GazeViewer.scss");

var _lodash = _interopRequireDefault(require("lodash"));

var _reactChartjs = require("react-chartjs-2");

require("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js");

require("chartjs-plugin-datalabels");

require("chartjs-plugin-annotation");

var _svdJs = require("svd-js");

var _mathjs = require("mathjs");

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
function get_blink_arr(obj) {
  var rawGaze = obj;
  var blk_arr = [];
  var BLKID = 0;
  var blink = {
    BLKID: null,
    BLKS: null,
    BLKD: null,
    GRB_start_index: null,
    GRB_end_index: null
  };
  var ingblink = false;

  for (var i = 0; i < rawGaze.length; i++) {
    if (rawGaze[i].BLKV) {
      if (BLKID !== rawGaze[i].BLKID) {
        //처음 눈을감음
        ingblink = true;
        BLKID = rawGaze[i].BLKID;
        blink.BLKID = BLKID;
        blink.BLKS = rawGaze[i].relTime;
        blink.GRB_start_index = i;
      }
    } else {
      if (ingblink === true) {
        ingblink = false;
        blink.GRB_end_index = i - 1 + 12;
        blink.BLKD = rawGaze[i - 1].BLKD + 0.1;
        blk_arr.push(JSON.parse(JSON.stringify(blink)));
        blink = {
          BLKID: null,
          BLKS: null,
          BLKD: null,
          GRB_start_index: null,
          GRB_end_index: null
        };
      }
    }
  } //console.log(blk_arr.length);


  return blk_arr;
}

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
    resizeInnerFrame(); // set_taskNumber(0);
    // set_nowTime(0);

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
      console.log("원본json", data); // console.log(data);

      var _taskArr = [];
      var MONITOR_PX_PER_CM = data.monitorInform.MONITOR_PX_PER_CM;
      var pixel_per_cm = data.monitorInform.MONITOR_PX_PER_CM; //1cm 당 pixel

      var degree_per_cm = Math.atan(1 / data.defaultZ) * 180 / Math.PI;
      var w = data.screenW;
      var h = data.screenH; //taskArr 의 trial 수만큼 반복

      for (var i = 0; i < data.screeningObjectList.length; i++) {
        var obj = _objectSpread(_objectSpread({}, data.screeningObjectList[i]), {}, {
          gazeData: data.taskArr[i]
        });

        _taskArr.push(obj);
      }

      console.log("데이터 형변환끝");
      console.log("taskArr 작업");

      for (var _i2 = 0; _i2 < _taskArr.length; _i2++) {
        var task = _taskArr[_i2];
        var type = task.type;
        var gazeArr = task.gazeData;
        var blink_arr = get_blink_arr(gazeArr);
        task.blinkArr = blink_arr;

        for (var j = 0; j < gazeArr.length; j++) {
          var target_pixels = {
            x: null,
            y: null
          };

          if (type === 'teleport') {
            //2~5 고정임
            if (gazeArr[j].relTime * 1 < task.startWaitTime * 1) {
              target_pixels.x = task.startCoord.x - w / 2;
              target_pixels.y = task.startCoord.y - h / 2;
            } else if (gazeArr[j].relTime * 1 < task.duration * 1 + task.startWaitTime * 1) {
              target_pixels.x = task.endCoord.x - w / 2;
              target_pixels.y = task.endCoord.y - h / 2;
            } else {
              if (task.isReturn) {
                target_pixels.x = task.startCoord.x - w / 2;
                target_pixels.y = task.startCoord.y - h / 2;
              } else {
                target_pixels.x = task.endCoord.x - w / 2;
                target_pixels.y = task.endCoord.y - h / 2;
              }
            }

            var target_xcm = target_pixels.x / pixel_per_cm;
            var target_ycm = target_pixels.y / pixel_per_cm;
            var target_xdegree = target_xcm * degree_per_cm;
            var target_ydegree = target_ycm * degree_per_cm;
            gazeArr[j].target_xdegree = target_xdegree;
            gazeArr[j].target_ydegree = target_ydegree;
          } else if (type === 'circular') {
            var radian = Math.PI / 180;
            var radius = task.radius;

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

        if (task.analysis.type === "saccade") {
          var A_ydegree_arr = [];
          var A_xdegree_arr = [];
          var B_ydegree_arr = [];
          var B_xdegree_arr = [];
          task.stabletime = {
            A_s: null,
            A_e: null,
            B_s: null,
            B_e: null
          };

          for (var _j = 0; _j < gazeArr.length; _j++) {
            if (gazeArr[_j].relTime * 1 >= task.startWaitTime * 1 - 2 && gazeArr[_j].relTime * 1 <= task.startWaitTime * 1) {
              if (task.stabletime.A_s === null) {
                task.stabletime.A_s = gazeArr[_j].relTime;
              }

              task.stabletime.A_e = gazeArr[_j].relTime;

              if (gazeArr[_j].xdegree !== null && gazeArr[_j].ydegree !== null) {
                A_xdegree_arr.push(gazeArr[_j].xdegree);
                A_ydegree_arr.push(gazeArr[_j].ydegree);
              }
            } else if (gazeArr[_j].relTime * 1 >= task.startWaitTime * 1 + task.duration * 1 - 2 && gazeArr[_j].relTime * 1 <= task.startWaitTime * 1 + task.duration * 1) {
              if (task.stabletime.B_s === null) {
                task.stabletime.B_s = gazeArr[_j].relTime;
              }

              task.stabletime.B_e = gazeArr[_j].relTime;

              if (gazeArr[_j].xdegree !== null && gazeArr[_j].ydegree !== null) {
                B_xdegree_arr.push(gazeArr[_j].xdegree);
                B_ydegree_arr.push(gazeArr[_j].ydegree);
              }
            }
          }

          var temp = {};
          temp.A_mean_ydegree = A_ydegree_arr.length && (0, _mathjs.mean)(A_ydegree_arr) || null;
          temp.A_mean_xdegree = A_xdegree_arr.length && (0, _mathjs.mean)(A_xdegree_arr) || null;
          temp.A_std_ydegree = A_ydegree_arr.length && (0, _mathjs.std)(A_ydegree_arr) || null;
          temp.A_std_xdegree = A_xdegree_arr.length && (0, _mathjs.std)(A_xdegree_arr) || null;
          temp.B_mean_ydegree = B_ydegree_arr.length && (0, _mathjs.mean)(B_ydegree_arr) || null;
          temp.B_mean_xdegree = B_xdegree_arr.length && (0, _mathjs.mean)(B_xdegree_arr) || null;
          temp.B_std_ydegree = B_ydegree_arr.length && (0, _mathjs.std)(B_ydegree_arr) || null;
          temp.B_std_xdegree = B_xdegree_arr.length && (0, _mathjs.std)(B_xdegree_arr) || null;
          A_ydegree_arr = [];
          A_xdegree_arr = [];
          B_ydegree_arr = [];
          B_xdegree_arr = []; //2표준편차밖을 제외하고 다시 구함

          for (var _j2 = 0; _j2 < gazeArr.length; _j2++) {
            if (gazeArr[_j2].relTime * 1 >= task.startWaitTime * 1 - 2 && gazeArr[_j2].relTime * 1 <= task.startWaitTime * 1) {
              if (task.stabletime.A_s === null) {
                task.stabletime.A_s = gazeArr[_j2].relTime;
              }

              task.stabletime.A_e = gazeArr[_j2].relTime;

              if (gazeArr[_j2].xdegree !== null && gazeArr[_j2].ydegree !== null) {
                if ((0, _mathjs.distance)([0, temp.A_mean_xdegree], [0, gazeArr[_j2].xdegree]) <= temp.A_std_xdegree) {
                  A_xdegree_arr.push(gazeArr[_j2].xdegree);
                }

                if ((0, _mathjs.distance)([0, temp.A_mean_ydegree], [0, gazeArr[_j2].ydegree]) <= temp.A_std_ydegree) {
                  A_ydegree_arr.push(gazeArr[_j2].ydegree);
                }
              }
            } else if (gazeArr[_j2].relTime * 1 >= task.startWaitTime * 1 + task.duration * 1 - 2 && gazeArr[_j2].relTime * 1 <= task.startWaitTime * 1 + task.duration * 1) {
              if (task.stabletime.B_s === null) {
                task.stabletime.B_s = gazeArr[_j2].relTime;
              }

              task.stabletime.B_e = gazeArr[_j2].relTime;

              if (gazeArr[_j2].xdegree !== null && gazeArr[_j2].ydegree !== null) {
                if ((0, _mathjs.distance)([0, temp.B_mean_xdegree], [0, gazeArr[_j2].xdegree]) <= temp.B_std_xdegree) {
                  B_xdegree_arr.push(gazeArr[_j2].xdegree);
                }

                if ((0, _mathjs.distance)([0, temp.B_mean_ydegree], [0, gazeArr[_j2].ydegree]) <= temp.B_std_ydegree) {
                  B_ydegree_arr.push(gazeArr[_j2].ydegree);
                }
              }
            }
          }

          task.A_mean_ydegree = A_ydegree_arr.length && (0, _mathjs.mean)(A_ydegree_arr) || null;
          task.A_mean_xdegree = A_xdegree_arr.length && (0, _mathjs.mean)(A_xdegree_arr) || null;
          task.A_std_ydegree = A_ydegree_arr.length && (0, _mathjs.std)(A_ydegree_arr) || null;
          task.A_std_xdegree = A_xdegree_arr.length && (0, _mathjs.std)(A_xdegree_arr) || null;
          task.B_mean_ydegree = B_ydegree_arr.length && (0, _mathjs.mean)(B_ydegree_arr) || null;
          task.B_mean_xdegree = B_xdegree_arr.length && (0, _mathjs.mean)(B_xdegree_arr) || null;
          task.B_std_ydegree = B_ydegree_arr.length && (0, _mathjs.std)(B_ydegree_arr) || null;
          task.B_std_xdegree = B_xdegree_arr.length && (0, _mathjs.std)(B_xdegree_arr) || null;
          var saccade_distance = void 0;

          if (task.A_mean_xdegree !== null && task.A_mean_ydegree !== null && task.B_mean_xdegree !== null && task.B_mean_ydegree !== null) {
            saccade_distance = (0, _mathjs.distance)([task.A_mean_xdegree, task.A_mean_ydegree], [task.B_mean_xdegree, task.B_mean_ydegree]);
          }

          task.sample = {
            start_position: {
              x: task.A_mean_xdegree,
              y: task.A_mean_ydegree
            },
            end_position: {
              x: task.B_mean_xdegree,
              y: task.B_mean_ydegree
            },
            saccade_distance: saccade_distance,
            fixation_threshold: 1,
            startTime: null,
            endTime: null,
            saccade_delay: null,
            saccade_duration: null,
            saccade_speed: null,
            //degree / sec
            fixation_stability: null
          };
          var isfoundStartTime = false;

          for (var _j3 = 0; _j3 < gazeArr.length; _j3++) {
            if (_j3 < gazeArr.length - 3 && gazeArr[_j3].relTime * 1 >= task.startWaitTime * 1) {
              //gazeArr[j].xdegree , gazeArr[j].ydegree
              //와 거리가
              // 0.5 이상인친구가
              //A_mean_xdegree ,A_mean_ydegree 
              if (gazeArr[_j3].xdegree === null || gazeArr[_j3].ydegree === null || gazeArr[_j3 + 1].xdegree === null || gazeArr[_j3 + 1].ydegree === null || gazeArr[_j3 + 2].xdegree === null || gazeArr[_j3 + 2].ydegree === null || task.A_mean_xdegree !== null || task.A_mean_ydegree !== null) {
                break;
              }

              if ((0, _mathjs.distance)([gazeArr[_j3].xdegree, gazeArr[_j3].ydegree], [task.A_mean_xdegree, task.A_mean_ydegree]) >= task.sample.fixation_threshold && (0, _mathjs.distance)([gazeArr[_j3 + 1].xdegree, gazeArr[_j3 + 1].ydegree], [task.A_mean_xdegree, task.A_mean_ydegree]) >= task.sample.fixation_threshold && (0, _mathjs.distance)([gazeArr[_j3 + 2].xdegree, gazeArr[_j3 + 2].ydegree], [task.A_mean_xdegree, task.A_mean_ydegree]) >= task.sample.fixation_threshold) {
                task.sample.startTime = gazeArr[_j3].relTime * 1;
                task.sample.saccade_delay = gazeArr[_j3].relTime * 1 - task.startWaitTime * 1;
                isfoundStartTime = true;
                break;
              }
            }
          }

          if (isfoundStartTime === false) {
            task.sample.startTime = null;
            task.sample.saccade_delay = null;
          }

          var isFoundEndTime = false;

          for (var _j4 = 0; _j4 < gazeArr.length; _j4++) {
            if (_j4 < gazeArr.length - 3 && task.sample.startTime !== null && gazeArr[_j4].relTime * 1 >= task.sample.startTime * 1) {
              if (gazeArr[_j4].xdegree === null || gazeArr[_j4].ydegree === null || gazeArr[_j4 + 1].xdegree === null || gazeArr[_j4 + 1].ydegree === null || gazeArr[_j4 + 2].xdegree === null || gazeArr[_j4 + 2].ydegree === null || task.B_mean_xdegree === null || task.B_mean_ydegree === null) {
                break;
              } //gazeArr[j].xdegree , gazeArr[j].ydegree
              //와 거리가
              // 0.5 이상인친구가
              //A_mean_xdegree ,A_mean_ydegree 


              if ((0, _mathjs.distance)([gazeArr[_j4].xdegree, gazeArr[_j4].ydegree], [task.B_mean_xdegree, task.B_mean_ydegree]) <= task.sample.fixation_threshold && (0, _mathjs.distance)([gazeArr[_j4 + 1].xdegree, gazeArr[_j4 + 1].ydegree], [task.B_mean_xdegree, task.B_mean_ydegree]) <= task.sample.fixation_threshold && (0, _mathjs.distance)([gazeArr[_j4 + 2].xdegree, gazeArr[_j4 + 2].ydegree], [task.B_mean_xdegree, task.B_mean_ydegree]) <= task.sample.fixation_threshold) {
                task.sample.endTime = gazeArr[_j4].relTime * 1;
                task.sample.saccade_duration = task.sample.endTime - task.sample.startTime;
                task.sample.saccade_speed = task.sample.saccade_distance / task.sample.saccade_duration;
                isFoundEndTime = true;
                break;
              }
            }
          }

          if (isFoundEndTime === false) {
            task.sample.endTime = null;
            task.sample.saccade_duration = null;
            task.sample.saccade_speed = null;
          } // 여기서도 제외를 해야하는데...


          var B_xydiff_arr = [];

          for (var _j5 = 0; _j5 < gazeArr.length; _j5++) {
            if (gazeArr[_j5].relTime * 1 >= task.startWaitTime * 1 + task.duration * 1 - 2 && gazeArr[_j5].relTime * 1 <= task.startWaitTime * 1 + task.duration * 1) {
              if (gazeArr[_j5].xdegree === null || gazeArr[_j5].ydegree === null || task.B_mean_xdegree === null || task.B_mean_ydegree === null) {
                break;
              }

              if (gazeArr[_j5].xdegree !== null && gazeArr[_j5].ydegree !== null) {
                if ((0, _mathjs.distance)([0, temp.B_mean_xdegree], [0, gazeArr[_j5].xdegree]) <= temp.B_std_xdegree && (0, _mathjs.distance)([0, temp.B_mean_ydegree], [0, gazeArr[_j5].ydegree]) <= temp.B_std_ydegree) {
                  B_xydiff_arr.push((0, _mathjs.distance)([task.B_mean_xdegree, task.B_mean_ydegree], [gazeArr[_j5].xdegree, gazeArr[_j5].ydegree]));
                }
              }
            }
          }

          task.sample.fixation_stability = B_xydiff_arr.length && (0, _mathjs.std)(B_xydiff_arr) || null;
        } else if (task.analysis.type === 'pursuit') {
          var rotation_dataset = [];
          var rdx = [];
          var rdy = [];
          var homogeneous_linear_dataset = [];

          for (var _j6 = 0; _j6 < gazeArr.length; _j6++) {
            if (gazeArr[_j6].relTime * 1 >= task.startWaitTime * 1 && gazeArr[_j6].relTime * 1 <= task.relativeEndTime - task.endWaitTime * 1) {
              //startWaitTime  ~  relativeEndTime - endWaitTime 
              if (gazeArr[_j6].xdegree !== null && gazeArr[_j6].ydegree !== null) {
                rdx.push(gazeArr[_j6].xdegree);
                rdy.push(gazeArr[_j6].ydegree);
              } //startWaitTime 
              // ax^2 + bxy + cy^2 + dx + ey + f = 0; //식을두고,
              // x^2 , xy , y^2 , x , y , 1


              homogeneous_linear_dataset.push([gazeArr[_j6].xdegree * gazeArr[_j6].xdegree, //X^2
              gazeArr[_j6].xdegree * gazeArr[_j6].ydegree, //XY
              gazeArr[_j6].ydegree * gazeArr[_j6].ydegree, // Y^2
              gazeArr[_j6].xdegree, //X
              gazeArr[_j6].ydegree //Y
              ]);
            }
          }

          var rdxmean = rdx.length ? (0, _mathjs.mean)(rdx) : null;
          var rdymean = rdy.length ? (0, _mathjs.mean)(rdy) : null;

          for (var _j7 = 0; _j7 < gazeArr.length; _j7++) {
            if (gazeArr[_j7].relTime * 1 >= task.startWaitTime * 1 && gazeArr[_j7].relTime * 1 <= task.relativeEndTime - task.endWaitTime * 1) {
              if (gazeArr[_j7].xdegree !== null && gazeArr[_j7].ydegree !== null && rdxmean !== null && rdymean !== null) {
                rotation_dataset.push([gazeArr[_j7].xdegree - rdxmean, gazeArr[_j7].ydegree - rdymean]);
              } //startWaitTime  ~  relativeEndTime - endWaitTime 
              //startWaitTime 

            }
          }

          if (rotation_dataset.length) {
            var _SVD = (0, _svdJs.SVD)(rotation_dataset),
                u = _SVD.u,
                v = _SVD.v,
                q = _SVD.q; // const resnew = SVD(homogeneous_linear_dataset,false,true);


            task.rotation_dataset = {
              rdxmean: rdxmean,
              rdymean: rdymean,
              data: rotation_dataset,
              u: u,
              //1202 * 2
              v: v,
              //2*2   //v는 항등행렬로 치고 무시합시다. (첫 회전 X)
              q: q,
              // 1*2
              mq: [q[0] * Math.sqrt(2 / rotation_dataset.length), q[1] * Math.sqrt(2 / rotation_dataset.length)] //(x/q[0])^2 + (y/q[1])^2 = 1 타원
              //sqrt(2/N) * U * diag(S)  회전을 제외 U

            };
          } else {
            task.rotation_dataset = {
              rdxmean: rdxmean,
              rdymean: rdymean,
              data: rotation_dataset,
              u: null,
              //1202 * 2
              v: null,
              //2*2   //v는 항등행렬로 치고 무시합시다. (첫 회전 X)
              q: null,
              // 1*2
              mq: [null, null] //(x/q[0])^2 + (y/q[1])^2 = 1 타원
              //sqrt(2/N) * U * diag(S)  회전을 제외 U

            };
          }

          task.sample = {};
          task.sample.H_radius = task.rotation_dataset.mq[0];
          task.sample.V_radius = task.rotation_dataset.mq[1];
          task.sample.H_offset = rdxmean;
          task.sample.V_offset = rdymean;
          task.sample.period = (task.relativeEndTime - task.endWaitTime - task.startWaitTime) / task.analysis.rotationCount; //소장님과 토론할것
          //  [ [q[0],0][0,q[1]] ]  //만들면좋음
          // 루트 1/1202 * 

          var fitArr = [];
          var diffArr = [];
          console.log("task.blinkArr", task.blinkArr);

          for (var k = 0; k < gazeArr.length; k++) {
            var direction = task.analysis.direction;
            var fit = {
              relTime: gazeArr[k].relTime
            };

            if (direction === 'clockwise') {
              //  a*sin(2pi/주기*X)+오프셋;
              fit.xdegreefit = task.sample.H_radius * Math.sin(2 * Math.PI / task.sample.period * (gazeArr[k].relTime - task.startWaitTime)) + task.sample.H_offset;
              fit.ydegreefit = -task.sample.V_radius * Math.cos(2 * Math.PI / task.sample.period * (gazeArr[k].relTime - task.startWaitTime)) + task.sample.V_offset;
            } else if (direction === 'anticlockwise') {
              fit.xdegreefit = -task.sample.H_radius * Math.sin(2 * Math.PI / task.sample.period * (gazeArr[k].relTime - task.startWaitTime)) + task.sample.H_offset;
              fit.ydegreefit = -task.sample.V_radius * Math.cos(2 * Math.PI / task.sample.period * (gazeArr[k].relTime - task.startWaitTime)) + task.sample.V_offset;
            }

            fitArr.push(fit);

            if (gazeArr[k].relTime >= task.startWaitTime && gazeArr[k].relTime <= task.relativeEndTime - task.endWaitTime) {
              if (gazeArr[k].xdegree !== null && gazeArr[k].ydegree !== null) {
                var isnot_blink = true;

                for (var p = 0; p < task.blinkArr.length; p++) {
                  // console.log("task.blinkArr[p]",task.blinkArr[p]);
                  if (task.blinkArr[p].GRB_start_index <= k && task.blinkArr[p].GRB_end_index >= k) {
                    // console.log("제외해야함")
                    isnot_blink = false;
                    break;
                  }
                }

                if (isnot_blink === true) {
                  if (gazeArr[k].xdegree !== null && gazeArr[k].ydegree !== null) {
                    diffArr.push((0, _mathjs.distance)([[gazeArr[k].xdegree, gazeArr[k].ydegree], [fit.xdegreefit, fit.ydegreefit]]));
                  }
                } // diffArr.push(distance([[gazeArr[k].xdegree, gazeArr[k].ydegree],
                //     [fit.xdegreefit, fit.ydegreefit]]));

              }
            }
          }

          task.diffArr = diffArr.length ? diffArr : null;
          task.sample.diff_fit_err = diffArr.length && (0, _mathjs.mean)(diffArr) || null;
          task.fitArr = fitArr; // console.log("여기볼게")
        }
      }

      console.log("taskArr 작업끝");
      var saveData;

      if (data.screeningType === 'saccade') {
        var up_saccade_delay_arr = [];
        var down_saccade_delay_arr = [];
        var left_saccade_delay_arr = [];
        var right_saccade_delay_arr = [];
        var up_saccade_speed_arr = [];
        var down_saccade_speed_arr = [];
        var left_saccade_speed_arr = [];
        var right_saccade_speed_arr = [];
        var up_fixation_stability_arr = [];
        var down_fixation_stability_arr = [];
        var left_fixation_stability_arr = [];
        var right_fixation_stability_arr = [];

        for (var _i3 = 0; _i3 < _taskArr.length; _i3++) {
          var _task = _taskArr[_i3];
          var _direction = _task.analysis.direction;

          if (_direction === 'top') {
            if (_task.sample.saccade_delay !== null) {
              up_saccade_delay_arr.push(_task.sample.saccade_delay);
            }

            if (_task.sample.saccade_speed !== null) {
              up_saccade_speed_arr.push(_task.sample.saccade_speed);
            }

            if (_task.sample.fixation_stability !== null) {
              up_fixation_stability_arr.push(_task.sample.fixation_stability);
            }
          } else if (_direction === 'bottom') {
            if (_task.sample.saccade_delay !== null) {
              down_saccade_delay_arr.push(_task.sample.saccade_delay);
            }

            if (_task.sample.saccade_speed !== null) {
              down_saccade_speed_arr.push(_task.sample.saccade_speed);
            }

            if (_task.sample.fixation_stability !== null) {
              down_fixation_stability_arr.push(_task.sample.fixation_stability);
            }
          } else if (_direction === 'left') {
            if (_task.sample.saccade_delay !== null) {
              left_saccade_delay_arr.push(_task.sample.saccade_delay);
            }

            if (_task.sample.saccade_speed !== null) {
              left_saccade_speed_arr.push(_task.sample.saccade_speed);
            }

            if (_task.sample.fixation_stability !== null) {
              left_fixation_stability_arr.push(_task.sample.fixation_stability);
            }
          } else if (_direction === 'right') {
            if (_task.sample.saccade_delay !== null) {
              right_saccade_delay_arr.push(_task.sample.saccade_delay);
            }

            if (_task.sample.saccade_speed !== null) {
              right_saccade_speed_arr.push(_task.sample.saccade_speed);
            }

            if (_task.sample.fixation_stability !== null) {
              right_fixation_stability_arr.push(_task.sample.fixation_stability);
            }
          }
        }

        saveData = {
          up_saccade_delay: up_saccade_delay_arr.length && (0, _mathjs.mean)(up_saccade_delay_arr) || null,
          down_saccade_delay: down_saccade_delay_arr.length && (0, _mathjs.mean)(down_saccade_delay_arr) || null,
          left_saccade_delay: left_saccade_delay_arr.length && (0, _mathjs.mean)(left_saccade_delay_arr) || null,
          right_saccade_delay: right_saccade_delay_arr.length && (0, _mathjs.mean)(right_saccade_delay_arr) || null,
          up_saccade_speed: up_saccade_speed_arr.length && (0, _mathjs.mean)(up_saccade_speed_arr) || null,
          down_saccade_speed: down_saccade_speed_arr.length && (0, _mathjs.mean)(down_saccade_speed_arr) || null,
          left_saccade_speed: left_saccade_speed_arr.length && (0, _mathjs.mean)(left_saccade_speed_arr) || null,
          right_saccade_speed: right_saccade_speed_arr.length && (0, _mathjs.mean)(right_saccade_speed_arr) || null,
          up_fixation_stability: up_fixation_stability_arr.length && (0, _mathjs.mean)(up_fixation_stability_arr) || null,
          down_fixation_stability: down_fixation_stability_arr.length && (0, _mathjs.mean)(down_fixation_stability_arr) || null,
          left_fixation_stability: left_fixation_stability_arr.length && (0, _mathjs.mean)(left_fixation_stability_arr) || null,
          right_fixation_stability: right_fixation_stability_arr.length && (0, _mathjs.mean)(right_fixation_stability_arr) || null
        }; // taskArr.saveData=saveData;

        console.log("saveData", saveData);
      } else if (data.screeningType === 'pursuit') {
        console.log("분석 pursuit");
        var clockwiseArr = [];
        var anticlockwiseArr = [];

        for (var _i4 = 0; _i4 < _taskArr.length; _i4++) {
          var _task2 = _taskArr[_i4];
          var _direction2 = _task2.analysis.direction;
          console.log("direction", _direction2);

          if (_direction2 === 'clockwise') {
            if (_task2.sample.diff_fit_err !== null) {
              clockwiseArr.push(_task2.sample.diff_fit_err);
            }
          } else if (_direction2 === 'anticlockwise') {
            if (_task2.sample.diff_fit_err !== null) {
              anticlockwiseArr.push(_task2.sample.diff_fit_err);
            }
          }
        }

        saveData = {
          clockwise_err: clockwiseArr.length && (0, _mathjs.mean)(clockwiseArr) || null,
          anticlockwise_err: anticlockwiseArr.length && (0, _mathjs.mean)(anticlockwiseArr) || null
        };
      }

      console.log("savedata 객체작업끝");
      console.log("taskArr", _taskArr);
      return _taskArr;
    } else {
      return null;
    }
  }, [data]);

  var endTime = _react.default.useMemo(function () {
    if (taskArr && taskArr[taskNumber]) {
      // console.log("지금꺼정보", taskArr[taskNumber]);
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
    if (endTime !== null) {
      set_nowTime(endTime);
    }
  }, [endTime]);

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
    var target_size = MONITOR_PX_PER_CM * task.target_size;

    if (type === 'teleport') {
      if (nowTime * 1 < task.startWaitTime * 1) {
        //startcoord
        set_targetLeft(task.startCoord.x - target_size / 2 + 'px');
        set_targetTop(task.startCoord.y - target_size / 2 + 'px');
      } else if (nowTime * 1 < task.duration * 1 + task.startWaitTime * 1) {
        set_targetLeft(task.endCoord.x - target_size / 2 + 'px');
        set_targetTop(task.endCoord.y - target_size / 2 + 'px');
      } else {
        //endcoord
        if (task.isReturn) {
          set_targetLeft(task.startCoord.x - target_size / 2 + 'px');
          set_targetTop(task.startCoord.y - target_size / 2 + 'px');
        } else {
          set_targetLeft(task.endCoord.x - target_size / 2 + 'px');
          set_targetTop(task.endCoord.y - target_size / 2 + 'px');
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
          x: task.centerCoord.x + radius * cosTheta * MONITOR_PX_PER_CM - target_size / 2,
          y: task.centerCoord.y - radius * sineTheta * MONITOR_PX_PER_CM - target_size / 2
        }; // console.log(sc);
        // console.log(target_size);

        set_targetLeft(sc.x + 'px');
        set_targetTop(sc.y + 'px');
      } else if (nowTime * 1 < task.duration * 1 + task.startWaitTime * 1) {
        // console.log(":asfasfasfsafsafasf");
        //nowdegree
        var nowDegree = -((task.startDegree - task.endDegree) * (nowTime - task.startWaitTime) / task.duration - task.startDegree);

        var _cosTheta3 = Math.cos(nowDegree * radian);

        var _sineTheta3 = Math.sin(nowDegree * radian);

        var nc = {
          x: task.centerCoord.x + radius * _cosTheta3 * MONITOR_PX_PER_CM - target_size / 2,
          y: task.centerCoord.y - radius * _sineTheta3 * MONITOR_PX_PER_CM - target_size / 2
        };
        set_targetLeft(nc.x + 'px');
        set_targetTop(nc.y + 'px');
      } else {
        // console.log("마지막 0.5초")
        var _cosTheta4 = Math.cos(task.endDegree * radian);

        var _sineTheta4 = Math.sin(task.endDegree * radian);

        var ec = {
          x: task.centerCoord.x + radius * _cosTheta4 * MONITOR_PX_PER_CM - target_size / 2,
          y: task.centerCoord.y - radius * _sineTheta4 * MONITOR_PX_PER_CM - target_size / 2
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
    rctx.clearRect(0, 0, w, h);
    var type = task.analysis.type; // console.log("drawGaze 호출")

    for (var i = 0; i < gazeArr.length; i++) {
      if (gazeArr[i].relTime <= nowTime * 1 && gazeArr[i].RPOGV) {
        // console.log("야 여기당");
        rctx.beginPath();
        rctx.lineWidth = 0.5;

        if (type === "antisaccade") {
          rctx.strokeStyle = 'rgb(0,255,0,0.3)';
          rctx.fillStyle = 'rgb(0,255,0,0.3)';
        } else {
          rctx.strokeStyle = 'rgb(255,0,0,0.3)';
          rctx.fillStyle = 'rgb(255,0,0,0.3)';
        } // let x = (gazeArr[i].RPOGX) * w;
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
    var fitArr = task.fitArr;
    var Gdata = {
      target_x: [],
      target_y: [],
      eye_x: [],
      eye_y: [],
      fit_x: [],
      fit_y: [],
      BLK: [{
        x: 0,
        y: 0
      }]
    }; //////////////////Blink 차트 구하기////////

    var ingblink = false;
    var BLKID = -1;
    var bstart_time = null;
    var bend_time = null; // console.log("blinkArr",blinkArr);

    var alpha_blink_time = 0.1;

    for (var i = 0; i < gazeArr.length; i++) {
      if (gazeArr[i].relTime <= nowTime) {
        if (gazeArr[i].BLKV) {
          if (BLKID !== gazeArr[i].BLKID) {
            //눈을감음
            ingblink = true;
            BLKID = gazeArr[i].BLKID;
            bstart_time = gazeArr[i].relTime;
          }
        } else {
          if (ingblink) {
            ingblink = false;
            bend_time = gazeArr[i - 1].relTime;
            Gdata.BLK.push({
              x: bstart_time * 1000,
              y: 0
            });
            Gdata.BLK.push({
              x: bstart_time * 1000,
              y: 1
            });
            Gdata.BLK.push({
              x: bend_time * 1000 + alpha_blink_time * 1000,
              y: 1
            });
            Gdata.BLK.push({
              x: bend_time * 1000 + alpha_blink_time * 1000,
              y: 0
            });
            bstart_time = null;
            bend_time = null;
          }
        }
      } else {
        if (bstart_time !== null) {
          var tmpendindex = void 0;

          if (gazeArr[i].BLKV) {
            //눈을감은상태임..여전히
            tmpendindex = i; //                      console.log("합당"+i);
          } else {
            tmpendindex = i - 1; //                    console.log("오류"+i);
            //console.log(rawGaze);
          }

          ingblink = false;
          bend_time = gazeArr[tmpendindex].relTime;
          Gdata.BLK.push({
            x: bstart_time * 1000,
            y: 0
          });
          Gdata.BLK.push({
            x: bstart_time * 1000,
            y: 1
          });
          Gdata.BLK.push({
            x: bend_time * 1000,
            y: 1
          });
          Gdata.BLK.push({
            x: bend_time * 1000,
            y: 0
          });
          bstart_time = null;
          bend_time = null;
        }

        break;
      }
    } // console.log("Gdata",Gdata)
    //////////////////Blink 차트 구하기////////
    // console.log("gazeArr",gazeArr);


    for (var _i5 = 0; _i5 < gazeArr.length; _i5++) {
      if (gazeArr[_i5].relTime <= nowTime * 1) {
        // console.log("gazeArr[i].target_xdegree?",gazeArr[i]);
        // console.log("target_xdegree:",gazeArr[i].target_xdegree)
        var target_xdata = {
          x: gazeArr[_i5].relTime * 1000,
          y: gazeArr[_i5].target_xdegree ? gazeArr[_i5].target_xdegree : 0
        };
        var target_ydata = {
          x: gazeArr[_i5].relTime * 1000,
          y: gazeArr[_i5].target_ydegree ? gazeArr[_i5].target_ydegree : 0
        };
        var eye_xdata = {
          x: gazeArr[_i5].relTime * 1000,
          y: gazeArr[_i5].xdegree !== null ? gazeArr[_i5].xdegree : 0
        };
        var eye_ydata = {
          x: gazeArr[_i5].relTime * 1000,
          y: gazeArr[_i5].ydegree !== null ? gazeArr[_i5].ydegree : 0
        };

        if (task.analysis.type === 'pursuit' && fitArr && fitArr[_i5]) {
          if (fitArr[_i5].xdegreefit !== null) {
            Gdata.fit_x.push({
              x: gazeArr[_i5].relTime * 1000,
              y: fitArr[_i5].xdegreefit !== null ? fitArr[_i5].xdegreefit : 0
            });
          }

          if (fitArr[_i5].ydegreefit !== null) {
            Gdata.fit_y.push({
              x: gazeArr[_i5].relTime * 1000,
              y: fitArr[_i5].ydegreefit !== null ? fitArr[_i5].ydegreefit : 0
            });
          }
        }

        Gdata.target_x.push(target_xdata);
        Gdata.target_y.push(target_ydata);

        if (gazeArr[_i5].xdegree !== null) {
          Gdata.eye_x.push(eye_xdata);
        }

        if (gazeArr[_i5].ydegree !== null) {
          Gdata.eye_y.push(eye_ydata);
        } // if(fit_x)Gdata.fit_x.push(fit_x);

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
      lineChart.chartInstance.data.datasets[6].data = Gdata.BLK; // if(equation){
      //     lineChart.chartInstance.data.datasets[4].data = Gdata.estimate;  
      // }

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

  var Goptions = _react.default.useMemo(function () {
    // console.log(taskArr[taskNumber]);
    //95% 신뢰구간 1.96
    // 99% 신뢰구간 2.58
    // std * 1.96 / 루트(모집단수)
    var analysis = taskArr[taskNumber].analysis || null;
    var ymin = null,
        ymax = null;

    if (analysis.type === 'saccade') {
      if (analysis.direction === 'top') {
        ymin = taskArr[taskNumber].A_mean_ydegree;
        ymax = taskArr[taskNumber].B_mean_ydegree;
      } else if (analysis.direction === 'bottom') {
        ymin = taskArr[taskNumber].B_mean_ydegree;
        ymax = taskArr[taskNumber].A_mean_ydegree;
      } else if (analysis.direction === 'right') {
        ymin = taskArr[taskNumber].A_mean_xdegree;
        ymax = taskArr[taskNumber].B_mean_xdegree;
      } else if (analysis.direction === 'left') {
        ymin = taskArr[taskNumber].B_mean_xdegree;
        ymax = taskArr[taskNumber].A_mean_xdegree;
      }
    }

    var annotation = [];

    if (taskArr[taskNumber].analysis.type === 'saccade') {
      annotation = [{
        drawTime: "afterDatasetsDraw",
        // (default)
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
        drawTime: "afterDatasetsDraw",
        // (default)
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
        drawTime: "afterDatasetsDraw",
        // (default)
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
        drawTime: "afterDatasetsDraw",
        // (default)
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
        drawTime: "afterDatasetsDraw",
        // (default)
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
        drawTime: "afterDatasetsDraw",
        // (default)
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
      } // saccade_duration 
      ];
    } //   console.log("annotation",annotation);


    return {
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
      annotation: {
        events: ["click"],
        annotations: annotation
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
    };
  }, [taskArr, taskNumber]);

  var _React$useState25 = _react.default.useState({
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

    }, {
      //fitx
      data: [],
      steppedLine: "before",
      label: "fit H",
      borderColor: "rgba(112,172,143,0.65)",
      //"#0000ff",
      backgroundColor: 'rgba(112,172,143,0.65)',
      fill: false,
      yAxisID: "degree",
      xAxisID: "timeid",
      borderWidth: 1.5,
      pointRadius: 0.3,
      //데이터 포인터크기
      pointHoverRadius: 2 //hover 데이터포인터크기

    }, {
      //fity
      data: [],
      steppedLine: "before",
      label: "fit V",
      borderColor: "rgba(222,128,143,0.65)",
      //"#0000ff",
      backgroundColor: 'rgba(222,128,143,0.65)',
      fill: false,
      yAxisID: "degree",
      xAxisID: "timeid",
      borderWidth: 1.5,
      pointRadius: 0.3,
      //데이터 포인터크기
      pointHoverRadius: 2 //hover 데이터포인터크기

    }, {
      //BLINK
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
      borderColor: "rgba(0,255,0,0.2)",
      //""#ff0000",
      backgroundColor: 'rgba(0,255,0,0.2)',
      fill: true,
      xAxisID: "timeid",
      yAxisID: "ax_blink",
      pointRadius: 0,
      //데이터 포인터크기
      pointHoverRadius: 0 //hover 데이터포인터크기

    } //BLINK
    ]
  }),
      _React$useState26 = _slicedToArray(_React$useState25, 1),
      Gdata = _React$useState26[0];

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
    }, index + 1 + "번 task");
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
  }, taskArr[taskNumber] && function () {
    // console.log("asfasf")
    var task = taskArr[taskNumber]; // console.log(task);

    if (task.analysis.type === 'antisaccade') {
      var MONITOR_PX_PER_CM = data.monitorInform.MONITOR_PX_PER_CM;
      var target_size = MONITOR_PX_PER_CM * task.target_size;
      var targetLeft1 = task.endCoord.x - target_size / 2 + 'px';

      var _targetTop = task.endCoord.y - target_size / 2 + 'px';

      var diff = task.startCoord.x - task.endCoord.x;
      var targetLeft2 = task.startCoord.x + diff - target_size / 2 + 'px';
      return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
        className: "baseTarget",
        style: {
          width: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
          height: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
          background: "white",
          left: targetLeft1,
          top: _targetTop
        }
      }), /*#__PURE__*/_react.default.createElement("div", {
        className: "baseTarget",
        style: {
          width: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
          height: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
          background: "white",
          left: targetLeft2,
          top: _targetTop
        }
      }), /*#__PURE__*/_react.default.createElement("div", {
        className: "baseTarget",
        style: {
          width: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
          height: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
          background: "white",
          left: task.startCoord.x - target_size / 2 + 'px',
          top: task.startCoord.y - target_size / 2 + 'px'
        }
      }));
    } else {
      return null;
    }
  }(), /*#__PURE__*/_react.default.createElement("div", {
    className: "target",
    style: {
      width: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
      height: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
      background: "".concat(taskArr[taskNumber] && taskArr[taskNumber].color),
      left: targetLeft,
      top: targetTop
    }
  }), taskArr[taskNumber] && function () {
    // console.log("asfasf")
    var task = taskArr[taskNumber]; // console.log(task);

    if (task.analysis.type === 'pursuit') {
      var direction = task.analysis.direction;
      var fit = {};

      if (nowTime <= task.startWaitTime) {
        //작은경우
        //맨꼭대기에 있어야함..
        fit.xdegreefit = task.sample.H_radius * Math.sin(0) + task.sample.H_offset;
        fit.ydegreefit = -task.sample.V_radius * Math.cos(0) + task.sample.V_offset;
      } else if (nowTime >= task.startWaitTime && nowTime <= task.relativeEndTime - task.endWaitTime) {
        //#@!
        //뭘 잘못했나?
        if (direction === 'clockwise') {
          //  a*sin(2pi/주기*X)+오프셋;
          fit.xdegreefit = task.sample.H_radius * Math.sin(2 * Math.PI / task.sample.period * (nowTime - task.startWaitTime)) + task.sample.H_offset;
          fit.ydegreefit = -task.sample.V_radius * Math.cos(2 * Math.PI / task.sample.period * (nowTime - task.startWaitTime)) + task.sample.V_offset;
        } else if (direction === 'anticlockwise') {
          fit.xdegreefit = -task.sample.H_radius * Math.sin(2 * Math.PI / task.sample.period * (nowTime - task.startWaitTime)) + task.sample.H_offset;
          fit.ydegreefit = -task.sample.V_radius * Math.cos(2 * Math.PI / task.sample.period * (nowTime - task.startWaitTime)) + task.sample.V_offset;
        }
      } else {
        fit.xdegreefit = task.sample.H_radius * Math.sin(0) + task.sample.H_offset;
        fit.ydegreefit = -task.sample.V_radius * Math.cos(0) + task.sample.V_offset;
      }

      fit.xcmfit = Math.tan(fit.xdegreefit * Math.PI / 180) * data.defaultZ;
      fit.ycmfit = Math.tan(fit.ydegreefit * Math.PI / 180) * data.defaultZ;
      fit.xpxfit = fit.xcmfit * data.monitorInform.MONITOR_PX_PER_CM;
      fit.ypxfit = fit.ycmfit * data.monitorInform.MONITOR_PX_PER_CM;
      var targetL, targetT;
      targetL = task.centerCoord.x + fit.xpxfit - data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size / 2;
      targetT = task.centerCoord.y + fit.ypxfit - data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size / 2;
      return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
        className: "target",
        style: {
          width: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
          height: taskArr[taskNumber] && data.monitorInform.MONITOR_PX_PER_CM * taskArr[taskNumber].target_size + 'px',
          background: "yellow",
          left: targetL,
          top: targetT
        }
      }));
    } else {
      return null;
    }
  }(), taskArr[taskNumber] && function () {
    // console.log("asfasf")
    var task = taskArr[taskNumber]; // console.log(task);

    if (task.type === 'circular') {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "originCircle",
        style: {
          left: "".concat(task.centerCoord.x - data.monitorInform.MONITOR_PX_PER_CM * task.distance, "px"),
          top: "".concat(task.centerCoord.y - data.monitorInform.MONITOR_PX_PER_CM * task.distance, "px"),
          width: "".concat(data.monitorInform.MONITOR_PX_PER_CM * task.distance * 2, "px"),
          height: "".concat(data.monitorInform.MONITOR_PX_PER_CM * task.distance * 2, "px")
        }
      });
    } else {
      return null;
    }
  }(), taskArr[taskNumber] && function () {
    // console.log("asfasf")
    var task = taskArr[taskNumber];
    if (!task.rotation_dataset) return null; // console.log(task);

    var xoffset_degree = task.rotation_dataset.rdxmean;
    var yoffset_degree = task.rotation_dataset.rdymean;
    var xoffset_cm = Math.tan(xoffset_degree * Math.PI / 180) * data.defaultZ;
    var yoffset_cm = Math.tan(yoffset_degree * Math.PI / 180) * data.defaultZ;
    var xoffset_px = xoffset_cm * data.monitorInform.MONITOR_PX_PER_CM;
    var yoffset_px = yoffset_cm * data.monitorInform.MONITOR_PX_PER_CM; //#@! 뭘 잘못했나?

    var width_degree = task.rotation_dataset.mq[0] || null;
    var height_degree = task.rotation_dataset.mq[1] || null; // console.log("width_degree",width_degree);

    var width_cm = Math.tan(width_degree * Math.PI / 180) * data.defaultZ;
    var height_cm = Math.tan(height_degree * Math.PI / 180) * data.defaultZ; // console.log("width_cm",width_cm);

    var width_px = width_cm * data.monitorInform.MONITOR_PX_PER_CM; //가로 반지름

    var height_px = height_cm * data.monitorInform.MONITOR_PX_PER_CM; //세로 반지름

    if (task.type === 'circular') {
      return /*#__PURE__*/_react.default.createElement("div", {
        className: "fitCircle",
        style: {
          left: "".concat(task.centerCoord.x - width_px + xoffset_px, "px"),
          top: "".concat(task.centerCoord.y - height_px + yoffset_px, "px"),
          width: "".concat(width_px * 2, "px"),
          height: "".concat(height_px * 2, "px")
        }
      });
    } else {
      return null;
    }
  }(), /*#__PURE__*/_react.default.createElement("div", {
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