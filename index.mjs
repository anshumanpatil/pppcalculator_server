import { createRequire } from 'module';
const require = createRequire(import.meta.url);

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
  let sourceCountryAbbr = abbrData.filter((c) => {
    return c.country == sourceCountry;
  });
  let targetCountryAbbr = abbrData.filter((c) => {
    return c.country.toLocaleLowerCase().indexOf(targetCountry.toLocaleLowerCase()) >= 0 || targetCountry.toLocaleLowerCase().indexOf(c.country.toLocaleLowerCase()) >= 0;
  });

  sourceCountryAbbr = sourceCountryAbbr.length ? sourceCountryAbbr : [{ country: '', currency_name: '', currency_code: '' }];
  targetCountryAbbr = targetCountryAbbr.length ? targetCountryAbbr : [{ country: '', currency_name: '', currency_code: '' }];

  return {
    sourceAmount,
    sourceCountry,
    targetCountry,
    targetAmount,
    sourceCountryAbbr,
    targetCountryAbbr,
  };
}

export const handler = async (event, context, callback) => {
  const query = event.queryStringParameters;

  const r = jsonData;
  // const r = await getOnlineData();
  const PPPData = getPPPData(r);
  const response = {
    statusCode: 400,
  }

  try {
    if (query.method == "countries") {
      response.statusCode = 200;
      response.body = JSON.stringify(getPPPCountries(PPPData));
    }
    if (query.method == "data") {
      response.statusCode = 200;
      response.body = JSON.stringify(PPPData);
    }
    if (query.method == "calculate") {
      const body = JSON.parse(event.body);

      const sourceAmount = body.sourceAmount;
      const sourceCountry = body.sourceCountry;
      const targetCountry = body.targetCountry;
      response.statusCode = 200;
      const resultCalculation = calculatePPP(PPPData, sourceAmount, sourceCountry, targetCountry);
      response.body = JSON.stringify(resultCalculation);
    }
  } catch (e) {
    response.statusCode = 400;
    response.body = JSON.stringify(e);
  }
  return response;
};
