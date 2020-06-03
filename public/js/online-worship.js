console.log("reporting for duty")

function respondToNavClick() {
    console.log($(this).attr("data-name"))
}


$(`.side-nav`).click(respondToNavClick)