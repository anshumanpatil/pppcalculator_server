const express = require('express');
const cors = require('cors');
const jsonData = require("./static.json");
const abbrData = require("./abbr.json");


const WORLD_BANK_DATA_INDEX = 1;


const getPPPData = (jsonResponse) => {
    let mockResponse = jsonResponse;
    mockResponse = mockResponse[WORLD_BANK_DATA_INDEX];
    mockResponse = mockResponse.filter((x) => {
        return (x.value != null);
    });
    mockResponse = mockResponse.map((x) => {
        const retVal = { "country": x.country.value, "date": x.date, "ppp": x.value };
        return retVal;
    });
    mockResponse = mockResponse.reduce((acc, curr) => {
        return Object.assign(Object.assign({}, acc), { [curr.country]: Object.assign(Object.assign({}, (acc[curr.country] || [])), { [curr.date]: curr.ppp }) });
    }, {});
    return mockResponse;
};

// const getOnlineData = () => {
//     const year = new Date().getFullYear();
//     return new Promise((resolve, reject) => {
//         axios.get(`https://api.worldbank.org/v2/en/country/all/indicator/PA.NUS.PPP?format=json&per_page=20000&source=2&date=${year - 5}:${year}`)
//             .then(function (response) {
//                 resolve(response.data);
//             })
//             .catch(function (error) {
//                 reject(error);
//             });
//     });
// };

const getPPPCountries = (PPPData) => {
    const returnResponse = Object.keys(PPPData).sort()
        .map((country) => {
            return { country, value: country };
        });
    return returnResponse;
};

function calculatePPP(PPPData, sourceAmount, sourceCountry, targetCountry) {
    const PPPDatasourceCountry = PPPData[sourceCountry];
    const PPPDatatargetCountry = PPPData[targetCountry];
    const SourcePPP = PPPDatasourceCountry[Math.max(...Object.keys(PPPDatasourceCountry).map((x) => parseInt(x)))];
    const TargetPPP = PPPDatatargetCountry[Math.max(...Object.keys(PPPDatatargetCountry).map((x) => parseInt(x)))];
    const targetAmount = (sourceAmount / SourcePPP * TargetPPP).toFixed(2);
    const sourceCountryAbbr = abbrData.filter((c) => {
        return c.country == sourceCountry;
    });
    const targetCountryAbbr = abbrData.filter((c) => {
        return c.country == targetCountry;
    });
    return {
        sourceAmount,
        sourceCountry,
        targetCountry,
        targetAmount,
        sourceCountryAbbr,
        targetCountryAbbr,
    };
}


const app = express();
app.use(cors());

const port = 5001;

app.get('/pppdata', (request, response) => {
    // console.log("body ", request.body);
    // console.log("query ", request.query);
    // console.log("params ", request.params);
    // console.log("method", request.method);
    const r = jsonData;
    // const r = await getOnlineData();
    const PPPData = getPPPData(r);
    try {
        if (request.query.method == "countries") {
            return response.status(200).json(getPPPCountries(PPPData));
        }
        if (request.query.method == "data") {
            return response.status(200).json(PPPData);
        }
        if (request.query.method == "calculate") {
            const sourceAmount = request.query.sourceAmount;
            const sourceCountry = request.query.sourceCountry;
            const targetCountry = request.query.targetCountry;
            return response.status(200).json(calculatePPP(PPPData, sourceAmount, sourceCountry, targetCountry));
        }
    } catch (e) {
        return response.status(400).json(e);
    }
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})