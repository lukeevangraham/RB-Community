/* JS Document */

/******************************

[Table of Contents]

1. Vars and Inits
2. Set Header
3. Init Header Search
4. Init Menu
5. Init Google Map


******************************/

$(document).ready(function () {
  "use strict";

  /* 

	1. Vars and Inits

	*/

  var header = $(".header");
  var hamb = $(".hamburger");
  var menuActive = false;
  var menu = $(".menu");
  // var map;
  var mapid = $("#mapid");

  setHeader();

  $(window).on("resize", function () {
    setHeader();
  });

  $(document).on("scroll", function () {
    setHeader();
  });

  initHeaderSearch();
  initMenu();
  // initGoogleMap();
  initLeafletMap();

  /* 

	2. Set Header

	*/

  function setHeader() {
    if ($(window).scrollTop() > 100) {
      header.addClass("scrolled");
    } else {
      header.removeClass("scrolled");
    }
  }

  /* 

	3. Init Header Search

	*/

  function initHeaderSearch() {
    if ($(".search_button").length) {
      $(".search_button").on("click", function () {
        document.querySelector(".search_input").focus();
        if ($(".header_search_container").length) {
          $(".header_search_container").toggleClass("active");
        }
      });
    }
  }

  /* 

	4. Init Menu

	*/

  function initMenu() {
    if (hamb.length) {
      if (menu.length) {
        hamb.on("click", function () {
          if (menuActive) {
            closeMenu();
          } else {
            openMenu();
          }
        });

        $(".menu_close").on("click", function () {
          if (menuActive) {
            closeMenu();
          } else {
            openMenu();
          }
        });
      }
    }
  }

  function closeMenu() {
    menu.removeClass("active");
    menuActive = false;
  }

  function openMenu() {
    menu.addClass("active");
    menuActive = true;
  }

  /* 

	5. Init Google Map

	*/

  function initGoogleMap() {
    var myLatlng = new google.maps.LatLng(42.992849, -71.060134);
    var mapOptions = {
      center: myLatlng,
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      draggable: true,
      scrollwheel: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
      styles: [
        {
          elementType: "geometry",
          stylers: [
            {
              color: "#f5f5f5",
            },
          ],
        },
        {
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#717171",
            },
          ],
        },
        {
          featureType: "administrative.land_parcel",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#bdbdbd",
            },
          ],
        },
        {
          featureType: "poi",
          elementType: "geometry",
          stylers: [
            {
              color: "#eeeeee",
            },
          ],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#757575",
            },
          ],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [
            {
              color: "#e5e5e5",
            },
          ],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#9e9e9e",
            },
          ],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [
            {
              color: "#ffffff",
            },
          ],
        },
        {
          featureType: "road.arterial",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#757575",
            },
          ],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [
            {
              color: "#dadada",
            },
          ],
        },
        {
          featureType: "road.highway",
          elementType: "geometry.fill",
          stylers: [
            {
              color: "#ffffff",
            },
          ],
        },
        {
          featureType: "road.highway",
          elementType: "geometry.stroke",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#616161",
            },
          ],
        },
        {
          featureType: "road.local",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#9e9e9e",
            },
          ],
        },
        {
          featureType: "transit.line",
          elementType: "geometry",
          stylers: [
            {
              color: "#e5e5e5",
            },
          ],
        },
        {
          featureType: "transit.station",
          elementType: "geometry",
          stylers: [
            {
              color: "#eeeeee",
            },
          ],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [
            {
              color: "#c9c9c9",
            },
          ],
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [
            {
              color: "#9e9e9e",
            },
          ],
        },
      ],
    };

    // Initialize a map with options
    map = new google.maps.Map(document.getElementById("map"), mapOptions);

    // Use an image for a marker
    var image = "images/marker.png";
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(42.992849, -71.060134),
      map: map,
      icon: image,
    });

    // Re-center map after window resize
    google.maps.event.addDomListener(window, "resize", function () {
      setTimeout(function () {
        google.maps.event.trigger(map, "resize");
        map.setCenter(myLatlng);
      }, 1400);
    });
  }

  // 6. Leaflet

  function initLeafletMap() {
    var mymap = L.map("mapid").setView([33.02, -117.061], 13);

    L.tileLayer(
      "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
      {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: "mapbox.streets",
        accessToken:
          "pk.eyJ1IjoiZGVsaXJpb3U1OCIsImEiOiJjazBraXp1MXgwbHNlM2ZvNGJsOW0xNzZsIn0.IRf4OdH3qM8cVwcZoVTHAA",
      }
    ).addTo(mymap);

    var marker = L.marker([33.02, -117.061]).addTo(mymap);

    marker
      .bindPopup(
        "<b>RB Community Church</b><br>17010 Pomerado Rd.<br>San Diego, CA 92128"
      )
      .openPopup();

    mymap.scrollWheelZoom.disable();

    mapid = mymap;
  }
});

async function handleContactSubmission(e) {
  // e.preventDefault();
  const values = document.querySelector("#contactForm").elements;

  if (
    values.email.value === "jeannewassef63@gmail.com" ||
    values.email.value === "jeannewassef@hotmail.com" ||
    values.email.value === "jeannewassef@hotmail.cimq" ||
    values.email.value === "joshuawassef26@gmail.com" ||
    values.email.value === "jeannewassef@hotmail.cima"
  ) {
    document.querySelector("#contactForm").innerHTML =
      "<h3>Your message was delivered</h3>";
  } else {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: values.name.value,
        email: values.email.value,
        message: values.message.value,
      }),
    });

    const content = await response.json();

    document.querySelector("#contactForm").innerHTML =
      "<h3>Your message was delivered</h3>";
  }
}
