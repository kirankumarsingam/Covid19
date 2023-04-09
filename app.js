const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`your server is error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const covertSankToCamel = (each) => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  };
};

const covertSankToCamelDistinct = (each) => {
  return {
    districtId: each.district_id,
    districtName: each.district_name,
    stateId: each.state_id,
    cases: each.cases,
    cured: each.cured,
    active: each.active,
    deaths: each.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getDetails = `select * from state order by state_id;`;
  const getDetailsResult = await db.all(getDetails);
  response.send(getDetailsResult.map((each) => covertSankToCamel(each)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const selectSpecificId = `select * from state where state_id = ${stateId};`;
  const selectSpecificIdResult = await db.get(selectSpecificId);
  response.send(covertSankToCamel(selectSpecificIdResult));
});

app.post("/districts/", async (request, response) => {
  const distinctPostMethod = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = distinctPostMethod;
  const insertPostMethod = `insert into district (district_name, state_id, cases, cured, active, deaths)
    values 
    (
        "${districtName}",
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  await db.run(insertPostMethod);
  response.send("District Successfully Added");
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteSpecificItem = `DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(deleteSpecificItem);
  response.send("District Removed");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const specificDistinctId = `select * from district where district_id = ${districtId};`;
  const specificDistinctIdResult = await db.get(specificDistinctId);
  response.send(covertSankToCamelDistinct(specificDistinctIdResult));
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDistinctId = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = updateDistinctId;
  const updateDistinctIdUpdate = `UPDATE district
SET district_name = "${districtName}", state_id = ${stateId}, cases = ${cases}, 
cured = ${cured}, active = ${active}, deaths = ${deaths}
WHERE district_id = ${districtId};`;
  await db.run(updateDistinctIdUpdate);
  response.send("District Details Updated");
});

module.exports = app;
