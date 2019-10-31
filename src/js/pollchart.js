import * as d3 from "d3"

//import Hammer from './hammer.js'
import polldata from './polldata.js'

var partyList = ["ukip", "oth", "brx", "grn","ldem", "lab", "con"];

function extractDataByKey(data, key) {
    return data.map(function(d) {
        return d[key];
    }).sort().filter(function(d, index, array) {
        //unique
        return d !== array[index - 1];
    });
}

function composeDataByParty(data, dataAvg, dateList) {
  // console.log(data)
    var pollsterList = extractDataByKey(data, "pollster"),
        dataByParty,
        dataByPartyPollster,
        dataByPartyDate;

    // data grouped by party  
    dataByParty = partyList.map(function(party) {
        return {
            party: party,
            values: data.map(function(d) {
                return {
                    date: d.timestamp,
                    pollster: d.pollster,
                    vi: d[party]
                };
            }).filter(p => p.vi !== "") //end of data.map (values)
        };
    }); //end of partyList.map

    // data grouped by party and pollster  
    dataByPartyPollster = dataByParty.map(function(d) {
        var datum = d.values;
        return {
            party: d.party,

            pollster: pollsterList.map(function(pollster) {
                return {
                    pollster: pollster,
                    values: datum.filter(function(p) {
                        return p.pollster === pollster;
                    }).map(function(p) {
                        return {
                            party: d.party,
                            pollster: p.pollster,
                            date: p.date,
                            vi: p.vi
                        };
                    }) //end of datum.filter (values)
                };
            }), //end of pollster.map
        };
    });

    // data grouped by party and pollster  
    dataByPartyDate = dataByParty.map(function(d) {
        var datum = d.values;
        //testDate = (+parseDate("15/02/2015"));

        return {
            party: d.party,

            values: dateList.map(function(date) {
                var viDayList,
                    viAvgList = [],
                    viAvg;

                function findViListByGroup(group, p) {
                    return datum.filter(function(d) {
                        switch (group) {
                            case 1:
                                return (d.pollster === p) && (d.date <= date) && (d.date > (date - dayConst * dayAvg));
                            case 2:
                                return (d.pollster === p) && (d.date <= date);
                            default:
                                console.err("wrong group!");
                        }
                    }).map(function(d) {
                        return d.vi;
                    });
                }

                dataAvg.filter(function(dAvg) {
                    if (dAvg.timestamp === date) {
                        viAvg = dAvg[d.party];
                    }
                });

                //TODO: add precaution conditions 
                if (viAvg !== undefined) {
                    //console.log(viAvg);
                    viAvg = Math.round(viAvg * 100) / 100;
                    //console.log(viAvg, " [r]");
                }

                // a list of vi of the day (viDayList)
                // for drawing the event area for vi average
                viDayList = datum.filter(function(d) {
                    return d.date === date;
                }).map(function(d) {
                    return d.vi;
                });

                // append viAvg if poll data is empty on this day
                if (viDayList.length === 0) {
                    viDayList[0] = viAvg;
                }

                //console.log(new Date(date), date, viAvg, viDayList);
                return {
                    party: d.party,
                    date: date,
                    vi: viAvg,
                    viMin: Math.min.apply(null, viDayList),
                    viMax: Math.max.apply(null, viDayList)
                    //viDayList: viDayList,
                    //viAvgList: viAvgList,
                };
            }) //end of dateList.map (values)  
        };
    }); //end of dataByParty.map

    // console.log(dataByPartyPollster)

    return {
        date: dataByPartyDate,
        pollster: dataByPartyPollster,
        extractDataByKey: function(data, key) {

            return data.map(function(d) {
                return d[key];
            }).sort().filter(function(d, index, array) {
                //unique
                return d !== array[index - 1];
            });

        }
    };
}

export default function pollchart(rawData) {
    // Data:
    var dayUnit,
        dayConst = 86400000,
        termDic = {
            lab: "Lab",
            ldem: "LD",
            brx: "Brexit",
            ukip: "UKIP",
            oth: "Other",
            grn: "Green",
            con: "Con"
        };

    var data, dataAvg, dataset,
        svgParty, svgPolls, svgDates, svgRects,
        dateList;

    // Date format:
    var dateStrX, dateEndX, // dates for axes drawing
        dateFormat = "%d/%m/%Y",
        xAxisTextFormat,
        formatYear = d3.timeFormat("%Y"),
        formatMonthYear = d3.timeFormat("%M,%Y"),
        formatMon = d3.timeFormat("%b"),
        formatMonth = d3.timeFormat("%B"),
        formatPercent = d3.format(".0%");
    // Parse the date / time
    var parseDate = d3.timeParse(dateFormat);

    // Window size and chart's coordinate system:
    var width, height,
        margin = {
            top: 30,
            right: 0,
            bottom: 30,
            left: 0
        },
        xAxis, yAxis, x, y,
        coord = {
            x: 0,
            y: 45
        };

    function render(rawData) {
        /* SVG */
        // x, y axes; circle, path, area (polygon as range), text
        var gx, gy, gp, ga, gr,
            gl1, gl2, gt1, gt2, gl3, gt3,
            gtAvg, gtVi, gcPoll, gcDate;

        // Add the svg
        var svg = d3.select("#pollchart")
            .append("svg")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Define the line
        var liner = d3.line().x(function(d) {
            return x(d.date);
        }).y(function(d) {
            return y(d.vi);
        });

        /* Data */
        var dataAvgEnd;

        data = rawData.sheets['vi-continuous-series'];

        //var dataAvgWrong = rawData.sheets['Con_Adj Log'];
        var dataAvgWrong = rawData.sheets['calcs2019'];
        dataAvg = dataAvgWrong.reverse();
        dataAvgEnd = [dataAvg[0]];
        //rawData.sheets['Constituency_adjustments'];
        //console.log("poll:", data);

        // Parse date
        data = data.map(function(d) {
            // + convert a Date object to time in milliseconds
            d.timestamp = +parseDate(d.date);
            return d;
        }).filter(function(d) {
            // only use daya since the beginning of Dec.
            return d.timestamp >= (+parseDate("01/01/2017"));
        });

        // dataAvgEnd[0].date indicates when the script last ran
        // dataAvgEnd[0].currentdate is the date in reality
        // dataAvgEnd[0].date = dataAvgEnd[0].date;//.currentdate;
        // Append the last avg to dataAvg if it's not yet there
        /*if (dataAvg[dataAvg.length-1].date !== dataAvgEnd.date) {
          dataAvg = dataAvg.concat(dataAvgEnd);
        }*/
        dataAvg = dataAvg.map(function(d) {
            d.timestamp = +parseDate(d.date);
            return d;
        });

        // Compose data
        // extract dates from both polls (data) and avg (dataAvg) datasets
        dateList = extractDataByKey(data.concat(dataAvg), "timestamp");
        dateList = dateList.filter(d => d != 0)

        dataset = composeDataByParty(data, dataAvg, dateList);
        //console.log(dateList);
        //console.log(dataAvg);
        //console.log(dataset.date);

        /* Window */
        setChartSize();

        /* D3: Drawing*/
        function addCoordinate() {
            gx = svg.append("g").attr("class", "x axis ff-ss fz-12");
            gy = svg.append("g").attr("class", "y axis ff-ss fz-12");
        }

        function drawCoordinate() {
            // x axis
            gx.attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .attr("x", -2)
                .style("text-anchor", "middle");
            // y axis
            gy.call(yAxis);
            gy.selectAll("g")
                .filter(function(d) {
                    return d;
                })
                .classed("sc-ddd", true);
            gy.selectAll("text")
                .attr("x", 10)
                .attr("dy", -3);
        }

        function addLines(svgObj) {
            var gh1 = svgObj.insert("g", ":first-child").attr("class", "hightlight1");
            gl1 = gh1.append("line").attr("class", "line-theday");
            gt1 = gh1.append("text").attr("class", "ff-ss fz-12").attr("fill", "#767676");
        }

        function drawLines() {
            var xs = [
                x(+parseDate("24/07/2019")),
                
            ];
           
            gl1
                .attr("x1", xs[0]).attr("y1", y(coord.x))
                .attr("x2", xs[0]).attr("y2", y(coord.y) - 10);
            gt1

                .attr("x", xs[0] - 5).attr("y", y(coord.y))
                .attr("text-anchor", "end")
                .text("Boris Johnson becomes PM")
        }

        // avg path
        function addPathWithLines(svgObj, className) {
            gp = svgObj.append("path")
                .attr("class", className);
        }

        function drawPathWithLines() {
            gp.attr("d", function(d) {
                if(d.party === "brx") {
                    return liner(d.values.filter(v => v.date >= 1547942400000))
                }
                return liner(d.values);
            });
        }

        //TODO: change to use muti-line voronoi
        function addPolygons(svgObj, className) {
            ga = svgObj.append("polygon")
                .attr("class", className);
        }

        function drawPolygons() {
            ga.attr("points", function(d) {
                var points,
                    yMax, yMin, ptMax, ptMin;

                // area for avg line and all vi dots
                ptMax = d.values.map(function(d) {
                    yMax = (d.viMax > d.vi) ? y(d.viMax) : y(d.vi) - 10;
                    return [x(d.date), yMax].join(",");
                }).join(" ");
                ptMin = d.values.map(function(d) {
                    yMin = (d.viMin < d.vi) ? y(d.viMin) : y(d.vi) + 10;
                    return [x(d.date), yMin].join(",");
                }).reverse().join(" ");

                points = [ptMax, ptMin];
                return points;
            });
        }

        function onPolygon() {
            var ele;
            if (width > 640) {
                ga.on("mouseover", function(d) {
                    ele = document.querySelector(".party-polls." + d.party);
                    d3.select(ele).classed("op-1-polls", true);
                    d3.select(this.parentNode).classed("op-1-path", true);
                }).on("mouseout", function() {
                    d3.select(ele).classed("op-1-polls", false);
                    d3.select(this.parentNode).classed("op-1-path", false);
                });
            }
        }

        function addRects(svgObj) {
            gr = svgObj.append("rect")
                .attr("class", function(d) {
                    return "t" + d;
                });
        }

        function drawRects() {
            gr.attr("x", function(d) {
                    return x(d) - (x(d) - x(d - dayConst)) / 2;
                })
                .attr("y", 0)
                .attr("width", function(d) {
                    return (x(d) - x(d - dayConst));
                })
                .attr("height", height);
        }

        function onRects() {
            var nl; //node list
            if (width > 640) {
                gr.on("mouseover", function(d) {
                        nl = document.querySelectorAll(".t" + d + ".op-0");
                        for (var i = 0; i < nl.length; i++) {
                            d3.select(nl[i]).classed("op-0", false);
                        }
                        //var n = document.createTextNode(' ');
                        //document.body.appendChild(n);
                        //document.body.removeChild(n);
                    })
                    .on("mouseout", function() {
                        for (var i = 0; i < nl.length; i++) {
                            d3.select(nl[i]).classed("op-0", true);
                        }
                    });
            }
        }

        function addCircle(svgObj, className) {
          svgObj.append("circle")
            .attr("class", className);
        }
        function drawCircle(className, cx, cy, r) {
          svgObj.select("className")
            .attr("class", className)
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", r);
        }

        function addCircles(svgObj, className, key) {
         // console.log('addCircles')
         // console.log(arguments)
            var g = svgObj.selectAll("circle")
                .data(function(d) {
                //  console.log("d from addCircles")
                 // console.log(d)
                    return d.values;
                })
                .enter().append("circle")
                //.attr("class", className);
                .attr("class", function(d) {
            //      console.log("circle class from addCircles");
             //     console.log(d)
                    return "t" + d[key] + " " + className;
                });
           //     console.log(g)
            return g;
        }

        function drawCircles(gc, r) {
          //console.log("drawCircles")
         // console.log(arguments)
            gc.attr("cx", function(d) {
                    return x(d.date) /*+ Math.random()*10*/ ;
                })
                .attr("cy", function(d) {
                    return y(d.vi);
                })
                .attr("r", r);
        }

        function onCirclePoll(gc) {
            var ele, eleList;
            //addCircle()

            if (width > 640) {
                gc.on("mouseover", function(d) {
                        // 1. Add tooltip
                        var xPos = parseFloat(d3.select(this).attr("cx")),
                            yPos = parseFloat(d3.select(this).attr("cy")),
                            xPosEnd = x(dateEndX),
                            yShift = 60,
                            date = new Date(d.date),
                            dateText = date.getDate() + " " + formatMon(date) + " " + date.getFullYear();

                        //drawLine(svg, xPos, yPos - 8, xPos, yPos - 120, "tp-line");
                        //drawCircle(svg, xPos, yPos, 5, "tp-circle");
                        var container = document.querySelector('#pollchart');
                        ele = document.querySelector("#pollchartTooltip");
                        d3.select(ele).classed('d-n', false);

                        // top or bottom
                        ele.style.top = ((yPos - yShift) < (-15)) ? ((yPos + yShift) + "px") : ((yPos - yShift) + "px");
                        if (xPos < (xPosEnd - 100)) {
                            // align right
                            ele.style.left = (container.offsetLeft + xPos - 5) + "px";
                            ele.style.right = "auto";
                        } else {
                            // align left
                            ele.style.left = "auto";

                            ele.style.right = (xPosEnd - xPos - 10) + "px";
                        }

                        eleList = ele.children;
                        eleList[0].textContent = d.pollster; //pollster
                        eleList[1].textContent = dateText; //date
                        eleList[2].textContent = termDic[d.party] + " " + d.vi + "%"; //party and vi
                        d3.select(eleList[2]).classed(d.party, true);

                        // 2. highlight paths
                        d3.select(this.parentNode).classed("op-1-pathpolls", true);
                        d3.select("." + d.party).classed("op-1-path", true);
                    })
                    .on("mouseout", function(d) {
                        // 1. Remove tooltip
                        //svg.select(".tp-line").remove();
                        //svg.select(".tp-circle").remove();

                        d3.select(ele).classed('d-n', true);
                        d3.select(eleList[2]).classed(d.party, false);

                        // 2. Remove highlight
                        d3.select(this.parentNode).classed("op-1-pathpolls", false);
                        d3.select("." + d.party).classed("op-1-path", false);
                    });
            }

        }

        function addTextAvg(svgObj, className, key) {
            gtAvg = svgObj.append("text")
                //TODO: make sure data order
                .datum(function(d) {
                    return {
                        key: d[key],
                        value: d.values[d.values.length - 1],
                        party: d.party
                    };
                })
                .attr("class", className);
        }

        function drawTextAvg() {
            // data last index, y shift
            var dl = dataAvgEnd[0],
                ys = {
                    con: 20,
                    grn: 20,
                    lab: -15,
                    ldem: -15,
                    ukip: -5
                };
            gtAvg.attr("text-anchor", "left")
                .attr("x", function(d) {
                    return x(d.value.date) + 8;
                })
                .attr("y", function(d) {
                    switch (d.party) {
                        case "con":
                            ys.con = 0;
                            break; //dl.con  > dl.lab  ? -15 : 20; break;
                        case "lab":
                            ys.lab = 0;
                            break; //dl.con  > dl.lab  ? 20 : -15; break;
                        case "ldem":
                            ys.ldem = dl.ldem > dl.ukip ? -15 : 20;
                            break;
                        case "grn":
                            ys.grn = 0;
                            break; //dl.grn  > dl.ldem ? -15 : 20; break;
                        case "brx":
                            ys.brx = dl.brx > dl.ukip ? -15 : 20;
                            break;
                        case "ukip":
                            ys.ukip = dl.ukip > dl.ldem ? -15 : 20;
                            break;  
                        case "oth":
                            ys.oth = dl.oth > dl.ukip ? -15 : 20;
                            break;
                    }
                    return y(d.value.vi) + 6 + ys[d.party] / 3;
                })
                .text(function(d) {
                    var flag = "lab",
                        num = d.value.vi; //Math.round(d.value.vi * 10) / 10;
                    if (d.party === "con") {
                        if (dataAvgEnd[0].con > dataAvgEnd[0].lab) {
                            flag = "con";
                        }
                    }
                    return d.party === flag ? num + "%" : num;
                });
        }

        function addTextVi(svgObj, className) {
            gtVi = svgObj.selectAll("text")
                .data(function(d) {
                    return d.values;
                })
                .enter().append("text")
                .attr("class", function(d) {
                    return "t" + d.date + " ff-ss fz-12 " + className;
                });
        }

        function drawTextVi() {
            // y shift
            var dd = dataset.date,
                ys = {
                    con: 20,
                    lab: -10,
                    ldem: -10,
                    grn: 20,
                    brx: -10,
                    ukip: -10,
                    oth: -10

                };

            gtVi.attr("x", function(d) {
                    return x(d.date) - 3;
                })
                .attr("y", function(d, i) {
                    // index ref: partyList = ["con", "lab", "ldem", "ukip", "grn"],
                    switch (d.party) {
                        case "con":
                            ys.con = dd[0].values[i].vi > dd[1].values[i].vi ? -10 : 20;
                            break;
                        case "lab":
                            ys.lab = dd[0].values[i].vi > dd[1].values[i].vi ? 20 : -10;
                            break;
                        case "ldem":
                            ys.ldem = dd[4].values[i].vi > dd[2].values[i].vi ? 20 : -10;
                            break;
                        case "grn":
                            ys.grn = dd[4].values[i].vi > dd[2].values[i].vi ? -10 : 20;
                            break;
                        case "brx":
                            ys.brx = dd[4].values[i].vi > dd[2].values[i].vi ? -10 : 20;
                            break;
                        case "oth":
                            ys.oth = dd[4].values[i].vi > dd[2].values[i].vi ? 20 : -10;
                            break;
                    }
                    return y(d.vi) + ys[d.party];
                })
                .text(function(d) {
                    return d.vi;
                });
        }

        function drawSVGInit() {
          // console.log('svginit')
            // 1. Draw coordinate
            addCoordinate();
            drawCoordinate();

            svgRects = svg.append("g")
                .attr("class", "dates op-0")
                .selectAll("rect")
                .data(dateList)
                .enter();

            svgParty = svg.selectAll("party")
                .data(dataset.date)
                .enter().append("g")
                .attr("class", function(d) {
                  // console.log('aint no party like')
                    return "party " + d.party;
                });

            svgDates = svg.selectAll("party-dates")
                .data(dataset.date)
                .enter().append("g")
                .attr("class", function(d) {
                    return "party-dates " + d.party;
                });

                // console.log(dataset.pollster)

            svgPolls = svg.selectAll("party-polls")
                .data(dataset.pollster)
                .enter().append("g")
                .attr("class", function(d) {
                    return "party-polls " + d.party;
                })
                .selectAll("g")
                .data(function(d) {
                    return d.pollster;
                })
                .enter().append("g")
                .attr("class", function(d, index) {
                    return "pollster p" + index;
                });

            // 2. Draw over time view
            addLines(svg);
            drawLines();
            addRects(svgRects);
            drawRects();
            onRects();
            gcDate = addCircles(svgDates, "op-0", "date");
            drawCircles(gcDate, 3.5);
            addTextVi(svgDates, "op-0");
            drawTextVi();

            // 3. Draw area, path (with lines) - avarage, text
            addTextAvg(svgParty, "ff-ss fz-14", "party");
            drawTextAvg();

            addPathWithLines(svgParty, "path-avg");
            drawPathWithLines();
            addPolygons(svgParty, "polygon-range");
            drawPolygons(svgParty);
            onPolygon();

            // 4. Draw path (with lines) - individuals, text
            //drawPathWithLines(svgPolls, "path-polls");
            //drawText(svgPollster, "pollster");

            // 5. Draw circle - vi
            gcPoll = addCircles(svgPolls, "circle-poll");
            drawCircles(gcPoll, 3);
            onCirclePoll(gcPoll);
        }

        function drawSVG() {
            drawCoordinate();
            drawLines();
            drawRects();
            drawCircles(gcDate, 3.5);
            drawTextVi();
            drawTextAvg();
            drawPathWithLines();
            drawPolygons();
            drawCircles(gcPoll, 3);
        }

        var to = null;

        function resize() {
            if (to) {
                clearTimeout(to);
                to = null;
            }
            to = setTimeout(function() {
                setChartSize();
                drawSVG();
            }, 100);
        }

        drawSVGInit();
        d3.select(window).on('resize', debounce(resize, 250));
        /* ************/
    }

    /* Window size update and redraw
    /* ******/
    function setChartSize() {
        // Dimensions of the chart
        var d = document,
            h = d.documentElement, //html
            p = d.querySelector("#pollchart"),
            s = d.querySelector("#pollchart svg"),
            w = p.clientWidth || h.clientWidth || window.innerWidth,
            h = h.clientHeight || window.innerHeight,
            h = (h > 480) ? 480 : (h - 80);

        width = w - margin.left - margin.right;
        height = h - margin.top - margin.bottom;
        s.setAttribute("height", h);

        // Ranges of the charts
        x = d3.scaleTime()
        .domain([new Date(2019, 0, 1), new Date(2019, 11, 12)])
        .range([0, width]);
        y = d3.scaleLinear().range([height, 0]);

        // Define the axes
        xAxis = d3.axisBottom().scale(x)
            // .ticks(20)
            // .tickSize(length)
            // .tickValues(["July", "October", "2018", "March", "June"]),
        yAxis = d3.axisRight().scale(y)
            .ticks(5)
            .tickSize(width)
            .tickFormat(function(d) {
                return d === 40 ? formatPercent(d / 100) : d;
            });

        // for mobile
        var today = dataAvg[0].date;
        var begin = dataAvg[dataAvg.length - 1].date;
        if (width < (1260 - 10)) {
            dateStrX = (+parseDate(begin)) - 5 * dayConst;
            dateEndX = (+parseDate(today)) + 120 * dayConst;
            xAxis.ticks(d3.timeYear);
            xAxisTextFormat = formatYear;
        } else {
            dateStrX = (+parseDate(begin)) - 10 * dayConst;
            dateEndX = (+parseDate(today)) + 60 * dayConst;
            xAxis.ticks(d3.timeMonth);
            xAxisTextFormat = formatMonth; //formatMonth;
        }

        // Calculate dayUnit
        dayUnit = x(dateStrX + dayConst) - x(dateStrX);

        // Scale the range of the data
        x.domain([new Date(2019, 0, 1), new Date(2019, 11, 12)]);
        y.domain([coord.x, coord.y]);

        // xAxis format
        xAxis.ticks(width < 400 ? 5 : 10)

        // resize the chart
        d3.select("#pollChart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
    }
    /* ************/

    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this,
                args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                func.apply(context, args);
            }
        };
    }

    return render(rawData);
}