let username

function respondToNavClick() {
  if ($(this).attr("data-name") === "chat") {
    loadChat();
  } else if ($(this).attr("data-name") === "giving") {
    // $("#sidebarMain").html("<h1>Giving</h1>");
    loadGiving();
  } else if ($(this).attr("data-name") === "prayer") {
    $("#sidebarMain").html("<h1>Prayer</h1>");
  } else if ($(this).attr("data-name") === "info") {
    $("#sidebarMain").html("<h1>Info</h1>");
  }
}

function processUsername() {
  username = $("#un").val()
  loadChat()
}

function loadChat() {
  if ((moment().format('ddd') === 'Wed') && (moment().isBetween(moment('09:30', 'H:mm'), moment('17:30', 'H:mm')))) {
    if (!username) {
      $("#sidebarMain").html(`<h4 class="mt-5 mb-2" style="color:black">Enter a username to chat</h4><form action=""><div class="form-group"><input type="text" class="form-control" id="un" placeholder="Enter username"><button class="form_submit_button px-2 mt-2" id="unSubmit">Submit</button></div></form>`)
    } else {
      $("#sidebarMain").html(`<ul id="messages" class="m"></ul><form id="messageForm" action=""><div class="form-row"><div class="col-10"><input type="text" class="form-control" placeholder="Enter message" id="m"autocomplete="off" /></div><div class="col-2"><div class="input-group-append"><button class="form_submit_button px-2">Send</button></div></div></div></form>`);
    }
  } else {
    $("#sidebarMain").html(`<h4 class="m-3">Chat is available on Sundays from 9:30am until 11:30am.</h4>`)
  }
}

function loadGiving() {
  $("#sidebarMain").html(`<h4 class="m-3"><a target="_blank" href="https://www.shelbygiving.com/App/Form/c22e10fa-1c2b-4a81-ada5-b64465d6ca94">Click here to give to RB Community church</a></h4>`)
}

$(document).ready(function () {
  loadChat();

  var socket = io();
  // When someone submits their username
  $(document).on("click", "#unSubmit", processUsername)

  //When someone submits a new message
  $(document).on("submit", "form", function (e) {
    socket.emit('chat message', username + ": " + $('#m').val());
    $('#m').val('');
    return false;
  })
  socket.on('chat message', function (msg) {
    console.log("MSG: ", msg.split(/:(.+)/)[1])
    $("#messages").append($('<li class="mb-2">').html( "<b>" + msg.split(/:(.+)/)[0] + ": </b>" + msg.split(/:(.+)/)[1]));

    $(`#messages`).scrollTop($(`#messages`)[0].scrollHeight);
  });
});

$(`.side-nav`).click(respondToNavClick);
