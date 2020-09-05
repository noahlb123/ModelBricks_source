const fs = require("fs");
const express = require("express");
const app = express();
const exphbs = require("express-handlebars");
const handlebars = require("handlebars");
const path = require("path");
const xml2js = require("xml2js");
// const util = require("util");
const fetch = require("node-fetch");
// const htmlparser2 = require("htmlparser2");
const PORT = process.env.PORT || 4002;

var indexRouter = require("./routes/index");

app.use(express.json());

// view engine setup
const hbs = exphbs.create({
  extname: "hbs",
  defaultLayout: "main",

  // create custom helper
  helpers: {
    trimString: function (passedString) {
      if (passedString.includes("::")) {
        var indexToSlice = passedString.indexOf("::") + 2;
        var length = passedString.length;
        var theString = passedString.slice(indexToSlice, length);
        return theString;
      } else {
        return passedString;
      }
    },
    trimVcid: function (passedString) {
      if (passedString.includes("(")) {
        var indexToSlice = passedString.indexOf("(") + 1;
        var length = passedString.length - 1;
        var theString = passedString.slice(indexToSlice, length);
        return theString;
      } else {
        return passedString;
      }
    },
    toDate: function (timeStamp) {
      var theDate = new Date(timeStamp);
      dateString = theDate.toGMTString();
      date = dateString.slice(5, 16);
      return dateString;
    },
    nullCheck: function (inputString) {
      var string = inputString;
      if (string) {
        return string;
      } else {
        string = "Null";
        return string;
      }
    },
  },
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");

// some pages for development purposes
// for viewing model json file in browser
app.get("/json", (req, res) => {
  var parser = new xml2js.Parser();
  fs.readFile("./biomodels/Biomodel_176189227.vcml", (err, data) => {
    parser.parseString(data, (err, result) => {
      res.send(result);
    });
  });
});
// for viewing model's annotation json file
app.get("/ajson", (req, res) => {
  var parser = new xml2js.Parser();
  fs.readFile(
    "./annotations/CM_PM18628746_MB1__Rab5_switch_annotations.xml",
    (err, data) => {
      parser.parseString(data, (err, result) => {
        res.send(result);
      });
    }
  );
});

// single model page for development purposes
app.get("/curatedList/model", (req, res) => {
  var parser = new xml2js.Parser();
  fs.readFile("Biomodel_147699816.xml", (err, data) => {
    parser.parseString(data, (err, result) => {
      const data = result;
      res.render("model", {
        title: "ModelBricks - Model Page",
        data,
      });
    });
  });
});

// main pages with dynamic content starts from here
// Fetching Curated List of models from Vcel Beta API
app.get("/curatedList", async (req, res) => {
  const api_url =
    "https://vcellapi-beta.cam.uchc.edu:8080/biomodel?bmName=&bmId=&category=all&owner=ModelBrick&savedLow=&savedHigh=&startRow=1&maxRows=1000&orderBy=date_desc";

  const fetch_response = await fetch(api_url);
  const json = await fetch_response.json();
  res.render("curatedList", {
    title: "ModelBricks - Curated List",
    json,
  });
});

// search function (filter) on curated list page
app.get("/curatedList/search", async (req, res) => {
  var bmName = req.query.bmName;
  const api_url =
    "https://vcellapi-beta.cam.uchc.edu:8080/biomodel?bmName=" +
    bmName +
    "&bmId=&category=all&owner=ModelBrick&savedLow=&savedHigh=&startRow=1&maxRows=10&orderBy=date_desc";

  const fetch_response = await fetch(api_url);
  const json = await fetch_response.json();
  res.render("curatedList", {
    title: "ModelBricks - Curated List",
    json,
    bmName,
  });
});

// main Dashboard for dynamic models selected from curated list page
app.get("/curatedList/model/:id", (req, res) => {
  // var info = "null";
  var parser = new xml2js.Parser();
  fs.readFile(
    "./biomodels/Biomodel_" + req.params.id + ".vcml",
    (err, data) => {
      parser.parseString(data, (err, result) => {
        data = result;
        res.render("model", {
          title: "ModelBricks - Model Page",
          data,
        });
      });
    }
  );
  var parser = new xml2js.Parser();
  fs.readFile(
    "./annotations/CM_PM12648679_MB5__Activator_inhibitor_annotations.xml",
    (err, data) => {
      parser.parseString(data, (err, result) => {
        info = result;
        let jsonData = JSON.stringify(info);
        fs.writeFileSync("./public/json/" + "annotations" + ".json", jsonData);
      });
    }
  );
});

// dynamic printable pages, option available on dashboard page
app.get("/curatedList/printModel/:id", (req, res) => {
  var parser = new xml2js.Parser();
  fs.readFile(
    "./biomodels/Biomodel_" + req.params.id + ".vcml",
    (err, data) => {
      parser.parseString(data, (err, result) => {
        const data = result;
        // generating static html pages in ./public/html
        var template = handlebars.compile(
          fs.readFileSync("./temp/modelTemplate.html", "utf8")
        );
        var generated = template({ data: data });
        fs.writeFileSync(
          "./public/html/" + "model_" + req.params.id + ".html",
          generated,
          "utf-8"
        );
        res.render("printModel", {
          title: "ModelBricks - Model Print Page",
          data,
        });
      });
    }
  );
});

//Declaring static informative pages folder (Home, About, motivation etc) - public
app.use(express.static(path.join(__dirname, "public")));

// Routing of informative pages - routes/index.js
app.use("/", indexRouter);

// Server Port
app.listen(PORT, (err) => {
  if (err) {
    return console.log("ERROR", err);
  }
  console.log(`Listening on port ${PORT}...`);
});

module.exports = app;
