import * as d3 from 'd3'
import pollchart from './pollchart.js'
import commons from './commons.js'

var jsonSrc = "https://interactive.guim.co.uk/docsdata-test/1li4b1KQ33q9mZKJSU0c6vgD35EoDA8c5m5LYOZ4gVr8.json";


d3.json(jsonSrc).then(data => {
        pollchart(data);
    commons.renderDayByDay("#daybyday", data);
})


