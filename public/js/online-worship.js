function respondToNavClick() {
  if ($(this).attr("data-name") === "chat") {
    loadChat();
  } else if ($(this).attr("data-name") === "giving") {
    $("#sidebarMain").html("<h1>Giving</h1>");
  } else if ($(this).attr("data-name") === "prayer") {
    $("#sidebarMain").html("<h1>Prayer</h1>");
  } else if ($(this).attr("data-name") === "info") {
    $("#sidebarMain").html("<h1>Info</h1>");
  }
}

function loadChat() {
  $("#sidebarMain").html(`<ul id="messages"></ul><form id="messageForm" action=""><div class="form-row"><div class="col-10"><input type="text" class="form-control" placeholder="Enter message" id="m"autocomplete="off" /></div><div class="col-2"><div class="input-group-append"><button class="form_submit_button px-2">Send</button></div></div></div></form>`);
}
$(document).ready(function () {
  loadChat();
});

$(`.side-nav`).click(respondToNavClick);
