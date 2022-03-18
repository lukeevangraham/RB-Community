const searchSite = () => {

    if (document.querySelectorAll(".search_input")[0].value) {

        window.location.replace(`/search:${document.querySelectorAll(".search_input")[0].value}`)
    } else {
        window.location.replace(`/search:${document.querySelectorAll(".search_input")[1].value}`)

    }





}