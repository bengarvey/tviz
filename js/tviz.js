function TrelloViz() {

  this.config = config;
  var circle = null;
  var svg = null;
  var cards;
  var completedCards = [];
  var labels;
  var leftMargin = 10;

  var listHeight = 400;
  var maxHeight = 2000;

  stage = 0;

  const BLUE = 'blue';
  const ORANGE = 'orange';
  const YELLOW = 'yellow';
  const RED = 'red';

  this.setStage = function(val) {
    stage = val;
  }

  this.start = function(tag) {

    var d3 = this.config.d3;
    svg = d3.select("svg")
            .attr("height", maxHeight)
            .attr("width", window.innerWidth);

    d3.json(this.config.path, function(data) {
      var cardIds = data[0];
      cards = setKeys(cardIds);
      d3.csv('data/labels.csv', function(csv) {
        cards = setLabels(csv, cards);
        getActions(cards);
        drawDividers();
      });
    });

    d3.select("body").append("div")
      .attr("class", "tip")
      .style("opacity", 0);
  }

  this.checkScroll = function() {
    stage = setStage();
  }

  function setStage() {
    var scroll = getScroll();
    return scroll< 150 ? 0 :
      scroll >= 150 && scroll < 155 ? 1 :
      scroll >= 155 && scroll < 400 ? 2 :
      scroll >= 400 ? 3 : 0;
  }

  function getScroll() {
    return window.pageYOffset;
  }

  function getIndex(i) {
    return ((completedCards.indexOf(cards[i])/cards.length) * window.innerWidth/3) + window.innerWidth/3;
  }

  function setLabels(labels, cards) {
    labels.forEach(function(l) { setLabel(l, cards) });
    return cards;
  }

  function setLabel(label, cards) {
    card = getCardById(label["trello_card_id"], cards);
    if (card) {
      card.labels.push(label);
    }
  }

  function getCardById(id, cards) {
    for(i=0;i<cards.length; i++) {
      if (id == cards[i].id) {
        return cards[i];
      }
    }
    return false;
  }

  function getPosition(i) {
    var rowSpacing = 8;
    var colSpacing = 8;
    var margin = leftMargin;
    var columns = getColumnSpace(colSpacing);
    var index = completedCards.indexOf(cards[i]);
    //var y = (getListPosition("Closed") * listHeight) + (Math.floor(index/columns)*rowSpacing);
    //var x = margin + ((index%columns) + (index%columns)*colSpacing);
    var y = calculateY(index, columns, rowSpacing, (getListPosition("Closed") + listHeight));
    var x = calculateX(index, columns, margin, colSpacing);
    return {x:x, y:y};
  }

  function getTypePosition(d, i) {
    var index = cards.filter( function(c) { return getLabel(ORANGE, d) == getLabel(ORANGE, c); }).indexOf(d);
    var columns = getColumnSpace(8);
    var typeIndex = getTypeIndex(getLabel(ORANGE, d));
    var x = calculateX(index, columns, 10, 8);
    var y = calculateY(index, columns, 8, (typeIndex * 200) + 400);
    return {x: x, y: y};
  }

  function calculateX(index, columns, margin, colSpacing) {
    return margin + ((index%columns) + (index%columns)*colSpacing);
  }

  function calculateY(index, columns, rowSpacing, margin) {
    return margin + (Math.floor(index/columns)*rowSpacing);
  }

  function getColumnSpace(colSpacing) {
    return Math.round((window.innerWidth/3)/(colSpacing));
  }

  function getCx(d, i, s) {
    return stage == 3 ? 10 :
      stage == 2 ? xType(d, i, s) :
      stage == 1 ? xRandom() :
      stage == 0 ? xList(d, i, s) : 0;
  }

  function xRandom() {
    return Math.random() * window.innerWidth;
  }

  function xList(d, i, s) {
    return d.complete ? getPosition(i).x : s[i].cx.baseVal.value;
  }

  function getCy(d, i, s) {
    return stage == 3 ? (i*10) :
      stage == 2 ? yType(d) :
      stage == 1 ? yRandom() :
      stage == 0 ? yList(d, i) : 0;
  }

  function yList(d, i) {
    return d.complete ? getPosition(i).y : getListPosition(d.list) * listHeight;
  }

  function yRandom() {
    return Math.random() * window.innerHeight + 150;
  }

  function xType(d,i,s) {
    return getTypePosition(d).x;
    return cards.filter( function(c) { return getLabel(ORANGE, d) == getLabel(ORANGE, c); }).indexOf(d) * 9;
  }

  function yType(d) {
    return getTypePosition(d).y;
    return getTypeIndex(getLabel(ORANGE, d)) * 250 + 400;
  }

  function getRadius(d) {
    return stage == 2 ? 3 :
      stage == 1 ? 3 :
      stage == 0 ? rList(d) : 3;
  }

  function rList(d) {
    return d.complete ? 3 : d.events.length;
  }

  function getTipPos() {
    var x = (window.innerWidth/3) + 100;
    var y = listHeight - 200;
    return {x:x,y:y};
  }

  function getFillColor(card) {
    var label = getLabel(ORANGE, card);
    return getColor(label);
  }

  function getColor(str) {
    var colors = {
      blue: '08C',
      orange: 'FA4',
      red: 'F64',
      yellow: 'FD0',
      green: '2F2'
    };

    var team = {
      Web: colors.green,
      Data: colors.yellow,
      Core: colors.blue
    }

    return team[str];
  }

  function getOpacity(card) {
    return hasRedLabel(card) ? 1 : 0.4;
  }

  function getStrokeColor(card) {
    return hasRedLabel(card) ? "red" : "black";
  }

  function getStrokeWidth(card) {
    return 0;
  }

  function getLabel(type, card) {
    if (card != null && card.labels != null) {
      for(i=0; i<card.labels.length; i++) {
        if (card.labels[i].color === type) {
          return card.labels[i].name;
        }
      }
    }
    return "";
  }

  function hasRedLabel(card) {
    for(i=0; i<card.labels.length; i++) {
      if (card.labels[i].color === 'red') {
        return true;
      }
    }
    return false;
  }

  function update(cards) {
    var circle = svg.selectAll("circle")
      .data(cards);

    var tip = d3.selectAll(".tip");

    circle.transition().duration(250)
      .attr("r", getRadius)
      .attr("cy", getCy)
      .attr("cx", getCx);
 
    circle.enter()
      .append("circle")
      .attr("cy", getCy)
      .attr("cx", function(d) { return Math.random() * (svg.attr("width")/3) + 1; })
      .attr("r", getRadius)
      .style("cursor", "default")
      .style("opacity", function(d) { return getOpacity(d);})
      .style("fill", function(d) { return getFillColor(d);})
      .style("stroke", function(d) { return getStrokeColor(d);})
      .style("stroke-width", function(d) { return getStrokeWidth(d);})
      .on("mouseover", function(d) {
        var html = getTipHtml(d);
        tip.transition()
              .duration(100)
              .style("opacity", .9);
          tip.html(html)
              .style("left", `${getTipPos().x}px`)
              .style("top", `${getTipPos().y}px`)
              .style("position", "absolute");
          addTimeline(tip, d);
          })
      .on("mouseout", function(d) {
          tip.transition()
              .duration(10)
              .style("opacity", 0);
      });


 }

  function addTimeline(tip, d) {
    coords = getTipPos();
    x = coords.x;
    y = coords.y;
    var svgTip = tip.append("svg").attr("height", 500).attr("width", 500);
    svgTip
      .append("line")
      .attr("x1", 0)
      .attr("y1", 15)
      .attr("x2", 200)
      .attr("y2", 15)
      .attr("stroke", '#666')
      .attr("stroke-width", 2);
    svgTip
      .append("rect")
      .attr("x", 83)
      .attr("y", 5)
      .attr("height", 18)
      .attr("width", 45)
      .style("fill", 'white');
    svgTip
      .append("text")
      .attr("x", 87)
      .attr("y", 17)
      .attr("fill", "#666")
      .attr("font-size", "10px")
      .attr("font-family","sans-serif")
      .style("cursor", "default")
      .text(`${d.duration} days`);
    placeTickMarks(svgTip, d.events);
  }

  function placeTickMarks(svg, events) {
    var first = new Date(events[0]).getTime();
    var last = new Date(events[events.length-1]).getTime();
    events.forEach( function(e) {
      placeTickMark(e, svg, first, last);
    });
  }

  function placeTickMark(e, svg, first, last) {
    eventDate = new Date(e).getTime();
    scaleX = (eventDate - first) / (last - first);
    svg.append("line")
      .attr("x1", scaleX * 200)
      .attr("y1", 0)
      .attr("x2", scaleX * 200)
      .attr("y2", 8)
      .attr("stroke", '#666')
      .attr("sroke-width", 1);
  }

  function getTipHtml(d) {
    var html = `<h3 class="tip-h3">${d.title.replace(/\) -/,")<br>", 1)}</h3>`;
    return html;
  }

  function drawDividers() {
    var positions = getListPositions();
    var line = svg.selectAll("line").data(positions);
    var listName = svg.selectAll("text").data(positions);
    drawLines(line);
    drawListNames(listName);
   }

  function getListPositions() {
    var positions = [];
    var space = listHeight/7;
    var names = getListNames();
    for(var i=0; i<5; i++) {
      positions[i] = {
        y: ((i+1)/7) * listHeight + (space/2),
        text: Object.keys(names)[i]
      }
    }
    return positions;
  }

  function drawListNames(listName) {
    listName.enter()
      .append("text")
        .attr("x", leftMargin)
        .attr("y", function(d) { return d.y - 10; })
        .attr("fill", "#DDD")
        .attr("font-size", "24px")
        .attr("font-family","sans-serif")
        .style("cursor", "default")
        .text(function(d) { return d.text; });
  }

  function drawLines(line) {
    line.enter()
      .append("line")
      .attr("x1", leftMargin)
      .attr("y1", function(d) { return d.y; })
      .attr("x2", window.innerWidth / 3)
      .attr("y2", function(d) { return d.y; })
      .attr("stroke", '#DDD')
      .attr("stroke-width", 3);
  }

  function processActions(actions, cards, currentTime) {
    var j = 0;
    while(j < actions.length) {
      // TODO rewrite all of this in a sane way
      if (new Date(actions[j]["date"]).getTime() < currentTime) {
        action = actions.shift();
        i = getCardId(cards, action["data_~_card_~_id"]);
        cards[i].events.push(action.date);

        if (action['data_~_listAfter_~_name'] != "") {
          cards[i].list = action['data_~_listAfter_~_name'];
        }
        if (action['data_~_listAfter_~_name'] == 'Closed') {
          completedCards.push(cards[i]);
        }
        else {
          if (completedCards.indexOf(cards[i]) > -1) {
          }
          cards[i].complete = false;
        }

        if (cards[i].list == 'Closed') {
          cards[i].complete = true;
        }

        if (action['data_~_card_~_name'] != "") {
          cards[i].title = action['data_~_card_~_name'];
        }

        if (cards[i].created_at == null) {
          cards[i].created_at = action.date;
        }

        cards[i].updated_at = action.date;
        cards[i].duration = dateDiff(cards[i].created_at, cards[i].updated_at);

      }
      else {
        j = actions.length;
      }
      j += 1;
    }

    return [actions, cards];

  }

  function dateDiff(d1, d2) {
    var date1 = new Date(d1);
    var date2 = new Date(d2);
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
    return diffDays;
  }

  function getActions(cards) {
    d3.csv('data/actions.csv', function(data) {
      var actions = data;
      var currentTime = new Date("2017-06-03 00:00:00").getTime();
      setInterval( function() {
        var results = processActions(actions, cards, currentTime);
        actions = results[0];
        cards = results[1];
        update(cards);
        currentTime += 1000 * 60 * 60 * 3;
       }, 100);
    }
    );
  }

  function getCardId(cards, id) {
    for(i=0; i<cards.length; i++) {
      if (cards[i].id === id) {
        return i;
      }
    }
    return {};
  }

  function setKeys(arr) {
    var obs = [];
    for(i=0; i<arr.length; i++) {
      var ob = {
       "id": arr[i],
       "events": [],
       "list": "Unknown",
       "complete": false,
       "title": null,
       "labels": []
      }
      obs.push(ob);
    }
    return obs;
  }

  function getTimelinePosition(date) {
    var MIN = 1483228800000;
    var MAX = Date.now();
    var stamp = new Date(date).getTime();
    return (stamp - MIN) / (MAX - MIN);
  }

  function getListNames() {
    return {
      "New":0,
      "Prepping": 1,
      "To Do (Ordered by Priority)": 2,
      "In Progress": 3,
      "In Review": 4,
      "Closed": 5
    };
  }

  function getTypeNames() {
    return {
      "Uncategories":0,
      "Core": 1,
      "Data": 2,
      "Web": 3,
    };
  }

  function getTypeIndex(name) {
    var lists = getTypeNames();
    if (typeof(lists[name]) === "undefined") {
      return 0;
    }
    return (lists[name] / 4);
  }

  function getListPosition(name) {
    var lists = getListNames();
      if (typeof(lists[name]) === "undefined") {
      return -1;
    }
    return (lists[name]+1) / 7;
  }

  function hashStr(str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash;
    }
    return (hash + 2147483647)/(2 * 2147483647);
  }

  return this;
}
