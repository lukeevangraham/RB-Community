require("dotenv").config();
let keys = require("../keys.js");
var request = require("request");
var moment = require("moment");
var path = require("path");

// Import the model (event.js) to use its database functions
var db = require("../models/");

var contentful = require("contentful");

let spaceId = process.env.SPACE_ID;
let contentfulAccessToken = process.env.ACCESS_TOKEN;

let vimeoPass = process.env.VIMEO_TOKEN;

var client = contentful.createClient({
  space: spaceId,
  accessToken: contentfulAccessToken
});

var vimeoOptions = {
  method: "GET",
  url: "https://api.vimeo.com/users/14320074/videos",
  qs: {
    query: "Sermon",
    fields:
      "name, link, pictures.sizes.link, pictures.sizes.link_with_play_button",
    sizes: "960",
    per_page: "6",
    page: "1"
  },
  headers: {
    Authorization: "Bearer " + vimeoPass
  }
};
var vimeoOptionsHome = {
  method: "GET",
  url: "https://api.vimeo.com/users/14320074/videos",
  qs: {
    query: "Sermon",
    fields:
      "name, link, pictures.sizes.link, pictures.sizes.link_with_play_button",
    sizes: "960",
    per_page: "3",
    page: "1"
  },
  headers: {
    Authorization: "Bearer " + vimeoPass
  }
};

function doReq(url, what) {
  return new Promise(function(resolve, reject) {
      request({
          url: url,
          headers: {
              'Bearer': 'sampleapitoken'
          }
      }, function(error, response) {
          if(error || response.statusCode !== 200) {
              reject(error);
          } else {
              var data = {};
              (Array.isArray(what) ? what : [what]).forEach(function(item, index) {
                  data[item] = JSON.parse(arguments[index + 2]);
              });
              resolve( data );
          }
      });
  });
}

// Routes
module.exports = function(app) {
  // app.get("/", function (req, res) {
  //     res.sendFile(path.join(__dirname, "../public.blog.html"));
  // });

  app.get("/blog", function(req, res) {
    db.Blog.findAll({
      order: [["longdate", "DESC"]]
    }).then(function(dbBlog) {
      // let str = dbBlog[0].dataValues.maincontent

      // let newTrimmedString = str.split('.')[0] + ".";
      // dbBlog['shortenedMain'] = newTrimmedString;

      var hbsObject = {
        blogpost: dbBlog,
        headContent: `<link rel="stylesheet" type="text/css" href="styles/blog.css">
                <link rel="stylesheet" type="text/css" href="styles/blog_responsive.css">`
        // shortenedMain: newTrimmedString
      };
    //   console.log("dbBLog: ", dbBlog);
      res.render("blog", hbsObject);
    });
  });

  app.get("/blog_single:id", function(req, res) {
    req.params.id = req.params.id.substring(1);
    // console.log(req.params)
    db.Blog.findAll({
      limit: 1,
      where: { id: req.params.id },
      raw: true
    }).then(function(dbBlog) {
      var bloghbsObject = {
        article: dbBlog,
        headContent: `<link rel="stylesheet" type="text/css" href="styles/blog_single.css">
                    <link rel="stylesheet" type="text/css" href="styles/blog_single_responsive.css">`
      };
      // console.log("hbsObject:  ", bloghbsObject.article);
      res.render("blog_single", bloghbsObject);
    });
  });

  app.get("/", function(req, res) {
  
var vimeoRecord = null;
let secondRecord = null;

    request(vimeoOptionsHome, function(error, response, body) {
      if (error) throw new Error(error);

      vimeoRecord = JSON.parse(body);
    
    

    client
      .getEntries({
        content_type: "events"
      })
      .then(function(dbEvent) {

        var items = dbEvent.items;

        // Converting times for template
        items.forEach(item => {
          Object.assign(item.fields, {
            shortMonth: moment(item.fields.date).format("MMM")
          });
          Object.assign(item.fields, {
            shortDay: moment(item.fields.date).format("DD")
          });
        });

        secondRecord = dbEvent
        return request(vimeoOptions, function(error, response, body) {
      if (error) throw new Error(error);

      

      return ;
        })
      }).then(function (body) {

        // console.log(body)
          console.log("VIMEO SAYS: ", vimeoRecord)
          // console.log("CONTENTFUL SAYS: ", secondRecord)
          
          var hbsObject = {
              events: secondRecord.items,
              vimeo: vimeoRecord,
              headContent: `<link rel="stylesheet" type="text/css" href="styles/main_styles.css">
              <link rel="stylesheet" type="text/css" href="styles/responsive.css">`
            };
            
            res.render("home", hbsObject);
        })
      })
  });

  app.get("/cms", function(req, res) {
    res.sendFile(path.join(__dirname, "../public/cms.html"));
  });

  app.get("/cms-post", function(req, res) {
    res.sendFile(path.join(__dirname, "../public/cms-post.html"));
  });

  // app.get("/events", function (req, res) {
  //     res.sendFile(path.join(__dirname, "../public/events.html"));
  // })

  app.get("/events", function(req, res) {

    client
      .getEntries({
        content_type: "events"
      })
      .then(function(dbEvent) {
        var items = dbEvent.items;

        // Converting times for template
        items.forEach(item => {
          Object.assign(item.fields, {
            shortMonth: moment(item.fields.date).format("MMM")
          });
          Object.assign(item.fields, {
            shortDay: moment(item.fields.date).format("DD")
          });
        });

        var hbsObject = {
          events: dbEvent.items,
          headContent: `<link rel="stylesheet" type="text/css" href="styles/events.css">
                    <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">`
        };
        return res.render("events", hbsObject);
      });
  });

  app.get("/about", function(req, res) {
    res.render("about", {
      headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`
    });
  });

  app.get("/sermons", function(req, res) {
    request(vimeoOptions, function(error, response, body) {
      if (error) throw new Error(error);

      var vimeo = JSON.parse(body);
      // console.log(vimeo)

      var latestSermon = JSON.parse(body).data[0];
      // console.log(latestSermon);

      var hbsObject = {
        vimeo: vimeo,
        headContent: `<link rel="stylesheet" type="text/css" href="styles/sermons.css">
                <link rel="stylesheet" type="text/css" href="styles/sermons_responsive.css">`
      };

      return res.render("sermons", hbsObject);
    });
  });

  app.get("/contact", function(req, res) {
    res.render("contact", {
      headContent: `<link rel="stylesheet" type="text/css" href="styles/contact.css">
        <link rel="stylesheet" type="text/css" href="styles/contact_responsive.css">`
    });
  });
};
