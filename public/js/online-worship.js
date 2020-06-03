function respondToNavClick() {
  if ($(this).attr("data-name") === "chat") {
    $("#sidebarMain").html("<h1>Chat</h1>")
} else if ($(this).attr("data-name") === "giving") {
    $("#sidebarMain").html("<h1>Giving</h1>")
} else if ($(this).attr("data-name") === "prayer") {
    $("#sidebarMain").html("<h1>Prayer</h1>")
} else if ($(this).attr("data-name") === "info") {
    $("#sidebarMain").html("<h1>Info</h1>")
    
}
}

$(`.side-nav`).click(respondToNavClick);
