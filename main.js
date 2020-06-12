let puppeteer = require('puppeteer');
let fs = require("fs");
let request = require("request");
let cheerio = require("cheerio");

let credentaialsFile = process.argv[2];

//function to every click
async function clickfun(tab, selector){
    await Promise.all([tab.waitForNavigation({waitUntil:"networkidle2"}),tab.click(selector)]);
}
//main program
(async function(){
    let data = await fs.promises.readFile(credentaialsFile,"utf-8");
    let credentaials = JSON.parse(data);
    login = credentaials.login;
    email = credentaials.email;
    pwd = credentaials.pwd;
   //start browser
    let browser = await puppeteer.launch({
        headless : false,
        defaultViewport:null,
        args:["--start-maximized","--incognito"],
        slowMo:100
    });
    //returns array of pages
    let numberofpages = await browser.pages();
    let tab = numberofpages[0];
   
    // goto page
    await tab.goto(login,{waitUntil:"networkidle2"});
    console.log("*   Opened Website");

    //click on detect location
    //click on search bar (Search doctors, clinic, hospital, etc);
    await tab.waitForSelector("input[data-qa-id='omni-searchbox-keyword']");

    //input to the search bar
    // one can search Dentist, Dermatologist, Homoeopath, Ayurveda
    await tab.type("input[data-qa-id='omni-searchbox-keyword']",process.argv[3],{delay:100}); 
    console.log(`*   Typed on search Bar -> ${process.argv[3]}`);


    //click on 1st option in drop down menue
    await clickfun(tab,"div[data-qa-id='omni-suggestion-listing']");
    console.log("*   clicked on suggestions in search bar");

    //click on short by
    //await tab.waitForSelector("div[class='u-d-inlineblock']");
    clickfun(tab,"div[class='u-d-inlineblock']");
    


    //selecting short by options from - Relevence, price-low-high, price high-low, year of experience, recommendation
    // How to USE :- 
    // experience_years          -> sort by on Year Of experience
    // consultation_fees         -> sort by on Price Low to High
    // consultation_fees_desc    -> sort by on Price High to Low
    // patient_experience_score  -> sort by on Recommendation
    await tab.waitForSelector(`li[data-qa-id="${process.argv[4]}"]`);
    await clickfun(tab,`li[data-qa-id="${process.argv[4]}"]`);
    console.log(`*   Clicked on short By - ${process.argv[4]} Selected`);

    //click on 1st link of the shorted doctors
    //await tab.waitForSelector("div[class='info-section']>a[href*='/']");
    await tab.waitForSelector("div[class='info-section']>a[href*='/']");
    console.log("*   Successfully parsed the details of Doctor");

    // managing new tab opened in new tab ( it will be treated as targe-black or popup)
    const lin = await tab.$("div[class='info-section']>a[href*='/']"); 
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));    // declare promise   
    await lin.click();
    
    //initializing new tab with tab2
    const tab2 = await newPagePromise;  
    let link = tab2.url();

    //******************************************************** cheerio Part ****************************************/

let url = link;
// npm install request 
console.log("sending Request");
request(url, function (err, response, data) {
    console.log("Data Recieved");
    // console.log(response);clear
    if (err === null && response.statusCode === 200) {
        fs.writeFileSync("practo.html", data);
        parseHTML(data);
        console.log("All Data Processed Successfully");
    } else if (response.statusCode === 404) {
        console.log("Page Not found");
    } else {
        console.log(err);
        console.log(response.statusCode)
    }
})
function parseHTML(data) {
    // page => cheeriopar
    // load => html 
    let $ = cheerio.load(data);
    // Page=> selector pass  => text => text
    console.log("-----------------------------------");
    let doctorname = $("h1[data-qa-id='doctor-name']").text();
    console.log("Doctors Name         - "+ doctorname);
    let docQual = $(".c-profile--qualification>p").text();
    console.log("Doctor Qualification - "+ docQual);

    // let docDescription = $("div[data-qa-id='doctor-summary']").text();
    var docDescription = $("div[data-qa-id='doctor-summary']").filter(function() {
        return $(this).text().trim() === 'fields.';
      }).text();



    console.log("Doctor Description   - "+docDescription);
    console.log("-----------------------------------")
    console.log("Timing :- ");
    let timing = $(".pure-u-1-3.u-cushion--left").text();
    console.log(timing);
    console.log("-----------------------------------");
    let docFee = $("span[data-qa-id='consultation_fee']").text();
    console.log("Consultation Fees - "+ docFee);
    console.log("-----------------------------------");
    }
    
    // console.log(text);
    //.pure-g.g-card

}());