let showNumbers = false;

const faces = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

const selectableColors = ['crimson', 'yellow', 'lime', 'skyblue', 'orange', 'violet', 'gold', 'silver'];

var positions = [
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0]
]

var colors = []

var turn = 1;
var players = 2;
var redLock = false;
var yellowLock = false;
var greenLock = false;
var blueLock = false;
var redWhiteLock = false;
var yellowWhiteLock = false;
var greenWhiteLock = false;
var blueWhiteLock = false;
var otherSelectWhite = true;
var selectWhite = true;
var turnOver = false;
var gameOver = false;

$(".open-rules").on("click", function() {
  $("#rules-modal").show()
})

$(".closer").on("click", function() {
  $(this).closest(".modal").hide()
})

$("#start-game").on("click", function() {
  players = $("#player-count").val();
  $(this).closest(".modal").hide()
  for (let player = 1; player <= players; player++) {
    colors.push($(`#player-row-${player} select`).val());
  }
  
  fetchSheet();
  $('button.roll-dice').on('click', rollAllDice);
  $('button.toggle-numbers').on('click', toggleNumbers);
  $('.score-cell').on('click', function () {crossOffCell(this);});
})

$("#add-player").on("click", function() {
  let playerCount = parseInt($("#player-count").val());
  let newPlayer = playerCount + 1;
  if (playerCount < 4){
    $("#player-count").val(newPlayer);
    $(`#player-row-${newPlayer}`).show();
  }
})

$("#sub-player").on("click", function() {
  let playerCount = parseInt($("#player-count").val());
  if (playerCount > 1){
    $("#player-count").val(playerCount - 1);
    $(`#player-row-${playerCount}`).hide();
  }
})

function getScoreSheet(){
  switch ($("#score-sheet-selection").val()){
    case "mixedNumbers": return mixedNumbers;
    case "mixedColors": return mixedColors;
    case "mixedNumbersAndColors": return mixedNumbersAndColors;
  }
  return originalSheet
}

function rollDice(dice) {
  const randomFace = Math.floor(Math.random() * 6) + 1;
  const pips = faces[randomFace];
  const $cells = $(dice).find('.pip');
  const $number = $(dice).find('.number');

  $cells.css('visibility', 'hidden');
  pips.forEach(index => $cells.eq(index).css('visibility', 'visible'));

  $number.text(randomFace);
}

function calculateNumberTable() {
  let white1 = parseInt($("#white-dice1").text());
  let white2 = parseInt($("#white-dice2").text());
  let whiteSum = white1 + white2;
  $("#white-sum").text(whiteSum);

  ["red", "yellow", "green", "blue"].forEach((color) => {
    if (!colorLocked(color)){
      selectCell($(`.${color}-${whiteSum}`), true)
      const diceValue = parseInt($(`#${color}-dice`).text());
      const sum1 = white1 + diceValue;
      const sum2 = white2 + diceValue;

      $(`#${color}-sums`).html(`${sum1}<br>${sum2}`);
      selectCell($(`.${color}-${sum1}[data-player='${turn}'`));
      selectCell($(`.${color}-${sum2}[data-player='${turn}'`));
    }
  });
  if (players == 1){
    if ($(".white").length == 0){
      selectOrSkipWhite(true);
    }
    else{
      $("#skip-color").addClass("white-background").text("Skip White").show();
      $("#instructions").text("Select a white number or skip white");
    }
  }
  else{
    $("#skip-color").addClass("white-background").text("Other Players Have Selected White").show();
    $("#instructions").text("Other player select a white number and then click the button");
  }
}

function selectCell(cells, white = false) {
  cells.each(function() {
    cell = $(this);
    if (!cell.hasClass("cross") && cell.data("pos") > rowPos(cell) && (!cell.hasClass("locked-cell") || $(`.cross[data-row=${cell.data("row")}][data-player=${cell.data("player")}]`).length >= 5)){
      if (white)
        cell.addClass("white");
      else
        cell.addClass("selected");
    }
  });
}

function rollAllDice() {
  $(".selected").removeClass("selected")
  $(".white").removeClass("white");
  selectWhite = true;
  otherSelectWhite = players > 1;
  turnOver = false;
  $("#roll").hide();
  $('.dice').each(function () {
    if (!$(this).hasClass("misses"))
      rollDice(this);
  });
  calculateNumberTable();
}

function toggleNumbers() {
  showNumbers = !showNumbers;
  const $allDice = $('.dice');

  if (showNumbers) {
    $allDice.addClass('show-number');
  } else {
    $allDice.removeClass('show-number');
  }

  $("#toggle").text(showNumbers ? 'Switch to Pips' : 'Switch to Numbers');
}

function fetchSheet() {
  let sheet = getScoreSheet();
  for (let player = 1; player <= players; player++) {
    $(`#score-sheet-${player}`).css('display', 'flex');
    var style = player == 1 ? `style='background-color:${colors[player-1]};'` : "";
    $(`#score-sheet-${player} tbody`).append($('<tr class="white-background">')
      .append($(`<td colspan=10 ${style} id="player-title-${player}">`).text($("#player-name-" + player).val()))
      .append($('<td colspan=2 style="border: solid 3px black; border-bottom: none;">').text('5+'))
      .append($('<td>').append($('<span class="points-txt">').text('Points')).append($('<span class="pnts-txt">').text('Pnts'))));
    sheet.forEach((row, rowIndex) => {
      const $row = $('<tr>');

      row.forEach((cell, index) => {
        let klass = `${cell.color}-${cell.number} ${cell.color} score-cell`;
        if (index === row.length - 1){
          klass += ' locked-cell';
          if (rowIndex == sheet.length - 1)
            klass += '" style="border-bottom: solid 3px black;';
        }
        $row.append($(`<td class="${klass}" data-pos="${index + 1}" data-row="${rowIndex}" data-player="${player}">`).text(cell.number));
        if (index === row.length - 1){
          klass = `${cell.color} cell-lock`;
          if (rowIndex == sheet.length - 1)
            klass += '" style="border-bottom: solid 3px black;';
          $row.append($(`<td class="${klass}" id="${cell.color}-lock-${player}" data-player="${player}">`).text("+")).append($(`<td class="${cell.color}" id="${cell.color}-score-${player}">`).text("0"));
        }
      });

      $(`#score-sheet-${player} tbody`).append($row);
    });
    $(`#score-sheet-${player} tbody`).append($('<tr>'))
      .append($('<td colspan=10 style="border-bottom-style: hidden;border-left-style: hidden;">'))
      .append($('<td colspan=2 class="misses">').html('Misses <span style="font-size:0.75em">(-5)</span>')).append($(`<td class="misses" id="misses-score-${player}">`).text('0'));
    $(`#score-sheet-${player} tbody`).append($('<tr>')
      .append($('<td colspan=10 style="border-bottom-style: hidden; border-top-style: hidden;border-left-style: hidden;">'))
      .append($('<td colspan=2 class="white-background">').text('Total')).append($(`<td class="white-background" id="total-score-${player}">`).text('0')));
  }
}

function crossOffCell(cell) {
  $cell = $(cell);
  let player = $cell.data("player")
  if (($cell.hasClass("selected") || $cell.hasClass("white")) && $cell.data("pos") > rowPos($cell) && (selectWhite && $cell.hasClass("white") || !selectWhite) && !turnOver && (player != turn || !otherSelectWhite)){
    let color = getCellColor($cell);
    $cell.removeClass("selected").removeClass("white").text("X").addClass("cross");
    setRowPos($cell);

    if ($cell.hasClass("locked-cell")){
      $(`.${color}.dice`).addClass("misses");
      $(`.${color}.dice`).find(".pip").css("visibility", "hidden");
      $(`.${color}.dice`).find(".number").css("visibility", "hidden");
      $(`#${color}-sums`).text("").parent().addClass("misses");
      calculateScore(color, player);
      $(`#${color}-lock-${player}`).text("X").addClass("cross");
      $(`${color}`).removeClass("selected")
      lockColor(color, $cell.data("player") != turn);
    }
    if (player != turn){
      $(`.white[data-player='${player}'`).removeClass("white");
      calculateScore(color, player);
    }
    else if (selectWhite && !gameIsOver()) {
      selectOrSkipWhite();
      calculateScore(color, player);
    }
    else {
      calculateScore(color, player);
      endTurn();
    }
  }
}

function getCellColor($cell){
  if ($cell.hasClass("red")) return "red";
  if ($cell.hasClass("yellow")) return "yellow";
  if ($cell.hasClass("green")) return "green";
  if ($cell.hasClass("blue")) return "blue";
}

function rowPos($cell){
  return positions[$cell.data("player")][$cell.data("row")];
}

function setRowPos($cell){
  return positions[$cell.data("player")][$cell.data("row")] = $cell.data("pos");
}

function lockColor(color, whiteLock){
  if (whiteLock){
    switch(color){
      case "red": redWhiteLock = true; break;
      case "yellow": yellowWhiteLock = true; break;
      case "green": greenWhiteLock = true; break;
      case "blue": blueWhiteLock = true; break;
    }
  }
  else{
    switch(color){
      case "red": redLock = !redLock; break;
      case "yellow": yellowLock = !yellowLock; break;
      case "green": greenLock = !greenLock; break;
      case "blue": blueLock = !blueLock; break;
    }
  }
}

function lockWhiteLock(){
  if (redWhiteLock) redLock = true;
  if (yellowWhiteLock) yellowLock = true;
  if (greenWhiteLock) greenLock = true;
  if (blueWhiteLock) blueLock = true;
}

function colorLocked(color){
  switch(color){
    case "red": return redLock;
    case "yellow": return yellowLock;
    case "green": return greenLock;
    case "blue": return blueLock;
  }
}

function missedButton() {
  if (!turnOver){
    let missScore = parseInt($(`#misses-score-${turn}`).text()) - 5;
    $(`#misses-score-${turn}`).text(missScore);
    calculateScore("miss", turn);
    endTurn(missScore);
  }
}

function endTurn(missScore = 0){
  turnOver = true;
  $(".selected").removeClass("selected")
  $(".white").removeClass("white");
  $("#skip-color").hide();
  $("#missed-button").hide();
  if (gameIsOver() || missScore == -20){
    gameOver = true;
    $("#instructions").text("Game Over");
  }
  else{
    $("#roll").show();
    $("#instructions").text("Roll the dice");
    $(`#player-title-${turn}`).css("background-color", "white");
    turn = turn % players + 1;
    $(`#player-title-${turn}`).css("background-color", colors[turn-1]);
  }
}

function gameIsOver(){
  let locks = 0;
  if (redLock) locks++;
  if (yellowLock) locks++;
  if (greenLock) locks++;
  if (blueLock) locks++;
  return locks == 2;
}

function selectOrSkipWhite(skipWhite = false){
  $(".white").removeClass("white");
  selectWhite = false;
  let nextStep = "skip a color";
  if (skipWhite){
    $("#skip-color").hide();
    $("#missed-button").show();
    nextStep = "take a miss";
  }
  else {
    $("#skip-color").removeClass("white-background").text("Skip Color");
  }
  $("#instructions").text("Select a color number or " + nextStep);
  lockWhiteLock();
}

function skipColor(){
  if (otherSelectWhite){
    otherSelectWhite = false;
    $(`.white:not([data-player='${turn}'])`).removeClass("white");
    if ($(".white").length == 0){
      selectOrSkipWhite(true);
    }
    else{
      $("#skip-color").addClass("white-background").text("Skip White").show();
      $("#instructions").text("Select a white number or skip white");
    }
  }
  else if (selectWhite)
    selectOrSkipWhite(true);
  else
    endTurn();
}

function calculateScore(color, player) {
  let score = parseInt($(`#total-score-${player}`).text());
  if (color === "miss")
    score -= 5;
  else {
    var colorCount = $(`.${color}.cross[data-player=${player}]`).length
    var colorScore = (colorCount * (colorCount + 1)) / 2;
    $(`#${color}-score-${player}`).text(colorScore);
    score = score + (colorScore - (colorScore - colorCount));
  }
  
  $(`#total-score-${player}`).text(score);
}

function capFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

$(document).ready(function() {
  let colorSelect = $("<select>").css("width", "90%");
  selectableColors.forEach((color) => {
    colorSelect.append($("<option>").attr("value", color).text(capFirstLetter(color)));
  });
  for (let player = 1; player <= 4; player++) {
    let hidden = player > 2 ? " style='display:none;'" : "";
    $(`#player-table tbody`).append($(`<tr id="player-row-${player}" ${hidden}>`)
      .append($(`<td>`).text("Player " + player))
      .append($(`<td>`).append(colorSelect.clone()))
      .append($(`<td>`).append($("<input>").attr("type", "text").attr("placeholder", "Name").attr("id", `player-name-${player}`).css("width", "90%"))));
  }
});