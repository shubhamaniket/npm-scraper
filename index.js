const say = require('say');
const ObjectsToCsv = require('objects-to-csv');
const request = require('request-promise');
const cheerio = require('cheerio');

const npm = [];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function scrapePackages(){
    try {
        for(var i=0;i<10;i++){
            const html = await request.get(`https://www.npmjs.com/search?q=react%20native&page=1&perPage=20&ranking=popularity`);
            const $ = await cheerio.load(html);
            $('div[class="w-80"]').each((i,ele)=>{
                const title = $(ele).children().first().children().children('h3').text();
                const desc = $(ele).children('p[class="_8fbbd57d f5 black-60 mt1 mb0 pv1 no-underline lh-copy"]').text();
                const url = 'https://www.npmjs.com'+$(ele).children().first().children('a').attr('href');
                const obj = {title,desc,url};
                npm.push(obj);
            })
        }
        return npm;
    } catch (error) {
        console.log(error)
    }
}

async function scrapeInstall(headers){
    return await Promise.all(headers.map(async install=>{
        const html = await request.get(install.url);
        const $ = cheerio.load(html);
        install.install_code = $('code[class="flex-auto truncate db"] > span').text();
        install.weekly_downloads = $('p[class="_9ba9a726 f4 tl flex-auto fw6 black-80 ma0 pr2 pb1"]').text();
        const data = [];
        const names = ['Version','License','Unpacked Size','Total Files','Issues','Pull Requests']
        $('p[class="f2874b88 fw6 mb3 mt2 truncate black-80 f4"]').each((i,ele)=>{
            const obj = names[i] + ' : ' +  $(ele).text();
            data.push(obj);
        })
        install.array = data;
        return install;  
    }))
}

async function createCsvFile(data){
    let csv = new ObjectsToCsv(data);
    await csv.toDisk("./data.csv");
}

async function main(){
    const headers = await scrapePackages();
    const result = await scrapeInstall(headers);
    await createCsvFile(result);
    console.log(result);
}

main();