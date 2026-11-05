/**
 * Company names sampled from the live WorkGraph jobs index (getworkgraph.com /api/jobs)
 * on 5 Nov 2026 (Asia/Calcutta), plus the documented SharkNinja ATS slug form.
 */
export const INDEX_COMPANY_NAME_CASES: Array<{
  raw: string
  expect: string
  confident?: boolean
}> = [
  { raw: "Sharkninjaoperatingllc", expect: "Sharkninja Operating LLC", confident: false },
  { raw: "Kirbygroupengineering", expect: "Kirby Group Engineering", confident: true },
  { raw: "Wundermanthompson", expect: "Wundermanthompson", confident: false },
  { raw: "Artefactlinkedin", expect: "Artefact Linkedin", confident: true },
  { raw: "Ivcevidensia", expect: "IVC Evidensia", confident: true },
  { raw: "Black Semiconductor GmbH", expect: "Black Semiconductor GmbH", confident: true },
  { raw: "DataClue GmbH", expect: "DataClue GmbH", confident: true },
  { raw: "Stripe", expect: "Stripe", confident: true },
  { raw: "Airbnb", expect: "Airbnb", confident: true },
  { raw: "OpenAI", expect: "OpenAI", confident: true },
  { raw: "Openai", expect: "OpenAI", confident: true },
  { raw: "Monzo", expect: "Monzo", confident: true },
  { raw: "GitLab", expect: "GitLab", confident: true },
  { raw: "CesiumAstro", expect: "Cesium Astro", confident: true },
  { raw: "HighLevel", expect: "HighLevel", confident: true },
  { raw: "StackAdapt", expect: "Stack Adapt", confident: true },
  { raw: "ClaimSorted", expect: "Claim Sorted", confident: true },
  { raw: "WorkWave", expect: "WorkWave", confident: true },
  { raw: "Trading212", expect: "Trading212", confident: true },
  { raw: "OLIVER", expect: "Oliver", confident: true },
  { raw: "Hims And Hers", expect: "Hims And Hers", confident: true },
  { raw: "Octopus Energy Group", expect: "Octopus Energy Group", confident: true },
  { raw: "Convene Hospitality Group", expect: "Convene Hospitality Group", confident: true },
  { raw: "Nord Security", expect: "Nord Security", confident: true },
  { raw: "Tilla Technologies", expect: "Tilla Technologies", confident: true },
  { raw: "VIA HealthTech", expect: "VIA HealthTech", confident: true },
  { raw: "Pennylane De", expect: "Pennylane De", confident: true },
  { raw: "Anyone Ai", expect: "Anyone AI", confident: true },
  { raw: "Headway.co", expect: "Headway.co", confident: true },
  { raw: "Jetsupport", expect: "Jetsupport", confident: false },
  { raw: "Workmotion", expect: "Workmotion", confident: false },
  { raw: "Listenlabs", expect: "Listen Labs", confident: true },
  { raw: "Alphasense", expect: "Alphasense", confident: false },
  { raw: "Checkatrade", expect: "Checkatrade", confident: false },
  { raw: "Digicert", expect: "DigiCert", confident: true },
  { raw: "Amplitude", expect: "Amplitude", confident: true },
  { raw: "Deliveroo", expect: "Deliveroo", confident: true },
  { raw: "Elastic", expect: "Elastic", confident: true },
  { raw: "Gartner", expect: "Gartner", confident: true },
  { raw: "Ashby", expect: "Ashby", confident: true },
  { raw: "ACME CORP", expect: "Acme Corp", confident: true },
  { raw: "acmeinc", expect: "Acme INC", confident: true },
  { raw: "northwindltd", expect: "Northwind LTD", confident: true },
  { raw: "Examplecompanyllc", expect: "Examplecompany LLC", confident: false },
]
