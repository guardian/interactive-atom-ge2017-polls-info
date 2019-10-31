export default function polldata () {

  var dayAvg = 14,
      dayConst = 86400000,
      //daySpecial = +(new Date(2015, 1, 4)),
      partyList = ["con", "lab", "ldem", "grn", "brx", "oth"], 
      //pGroup2 = ["ComResP", "ComResO", "ICM", "Ipsos", "TNS", "Survation"];
      pGroup1 = ["Lord Ashcroft", "Opinium", "Populus", "YouGov"];

  /*function averageArray(array) {
    var sum = array.reduce(function(preVal, curVal) {
        return preVal + curVal;
        });
    return sum / array.length;
  }*/

  return {
    //function extractDataByKey(data, key) {
    extractDataByKey: function(data, key) {
      return data.map(function(d) {
          return d[key];
          }).sort().filter(function(d, index, array) {
            //unique
            return d !== array[index - 1];
            });     
    },

    //function composeDataByParty(data) {
    composeDataByParty: function(data, dataAvg, dateList) {
      var pollsterList = this.extractDataByKey(data, "pollster"),
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
            };})//end of data.map (values)
      };});//end of partyList.map

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
          };}), //end of pollster.map
      };});

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
                  case 1: return (d.pollster === p) && (d.date <= date) && (d.date > (date - dayConst*dayAvg));
                  case 2: return (d.pollster === p) && (d.date <= date); 
                  default: console.err("wrong group!");
                }
              }).map(function(d) {
                return d.vi;
              });
            }
           
            // Get average vi (viAvg) value 
            /*if (date <= daySpecial) {
            
              /* Date before Feb. 2nd * /
              // 1a. Take the vi from the past 14 days and average it (if any)
              pGroup1.forEach(function(d) {
                var li = findViListByGroup(1, d);
                //if (date === testDate) { console.log(li, averageArray(li), d); }
                if (li.length !== 0) {
                  viAvgList.push(averageArray(li));
              }});
              //if (date === testDate) { console.log("---");}  

              // 1b. Take the nearest vi from the past (if any)
              pGroup2.forEach(function(d) {
                var li = findViListByGroup(2, d),
                len = li.length;
                // if (date === testDate) { console.log(li, li[len-1], d);}  
                if (len !== 0) {
                  viAvgList.push(li[len-1]);
              }});
              
              // 1. avg vi from calculation 
              console.log(viAvgList);  
              viAvg = Math.round(averageArray(viAvgList) * 100) / 100; 
            
            } else {
            */
              /* Date after Feb. 2nd */
              // 2. avg vi from dataAvg (precalculated by a script)
              dataAvg.filter(function(dAvg) {
                if (dAvg.timestamp === date) {
                  viAvg = dAvg[d.party];
                }
              });
            //}

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

      return { 
        date: dataByPartyDate,
        pollster: dataByPartyPollster
      };
    }
  }; //end of polldata's return
}