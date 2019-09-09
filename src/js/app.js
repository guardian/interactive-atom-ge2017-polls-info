import * as d3 from 'd3'
import pollchart from './pollchart.js'
//import colours from "./palette"
// TO DO: Import seatscharts/commons

var newLink = "docsdata-test/1azy_WeKw4qLydt2TVRMTzx5Rz-yav5vGY3vRyF_3InE";
var jsonSrc = "https://interactive.guim.co.uk/" + newLink + ".json";


d3.json(jsonSrc).then(data => {
    // setTimeout(() => {
        pollchart(data);
    // }, 3000)
    
    // commonsChart.renderDayByDay("#daybyday", data);
})


