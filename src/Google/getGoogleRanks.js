import html2canvas from "html2canvas";

const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);
const start = params.get('start');

const currPage = (start / 10) + 1;
let nPages;

chrome.storage.sync.get(['nPages'], (items) => {
    nPages = items.nPages;

    console.log('currentPage ' + currPage);

    let results = document.querySelectorAll('.MjjYud:not(:has(div.cUnQKe, .Ww4FFb.vt6azd.obcontainer, .oIk2Cb, .EyBRub))');
    if (results.length == 0) results = document.querySelectorAll('.TzHB6b.cLjAic.K7khPe')

    let newData = [];
    //let BNODE_INDEX = (10 * (currPage - 1)) + 1;
    //let BNODE_INDEX = items.bNodeIndex;
    let BNODE_INDEX = 1;
    console.log('bnode' + BNODE_INDEX);
    //let RANK_INDEX = (10 * (currPage - 1)) + 1;
    //let RANK_INDEX = items.bNodeIndex;
    let RANK_INDEX = 1;
    const vocab = "https://rankingcitation.dei.unipd.it";
    const ontology = vocab + "/ontology/";
    const resource = vocab + "/resource/";

    results.forEach((result) => {

        const title = result.querySelector('.yuRUbf>a>h3').innerText;
        const resultURL = result.querySelector('.yuRUbf>a').href;
        const publicationYear = result.querySelector('.MUxGbd.wuQ4Ob.WZ8Tjf') ?
            result.querySelector('.MUxGbd.wuQ4Ob.WZ8Tjf').innerText.split(' ')[2] : '0';
        const authors = result.querySelector('.VuuXrf').innerText;

        newData.push({
            //"@id": vocab + "result" + RESULT_INDEX,
            "@id": resultURL,
            "rdfs:label": [{
                "@value": "rank" + RANK_INDEX,
            }],
            "@type": "rco:SearchResult",
            "schema:title": title,
            "schema:url": resultURL,
            "rco:authors": authors,
            "rco:publicationYear": publicationYear,
            "rco:currentPage": currPage,
        });

        RANK_INDEX++;

        //const bnodeString = vocab + "_bnode" + BNODE_INDEX;
        const bnodeString = "_:bnode" + BNODE_INDEX;


        // Try with results.indexof(result) == results.length-1
        //if (BNODE_INDEX === (results.length) * nPages) {
        if (Array.from(results).indexOf(result) === results.length - 1) {
            if (currPage != nPages) {
                const PREV_BNODE_INDEX = BNODE_INDEX - 1;
                const prev_node = "_:bnode" + PREV_BNODE_INDEX;
                newData.push({
                    "@id": prev_node,
                    "rdf:first": { "@id": resultURL },
                    "rdf:rest": { "@id": `_:resultList${currPage + 1}` }
                })
            } else {
                const PREV_BNODE_INDEX = BNODE_INDEX - 1;
                const prev_node = "_:bnode" + PREV_BNODE_INDEX;
                newData.push({
                    "@id": prev_node,
                    "rdf:first": { "@id": resultURL },
                    "rdf:rest": { "@id": "rdf:nil" }
                });
            }

            return;
        }

        newData.push({
            "@id": bnodeString,
            "@type": "rdf:List"
        });

        if (BNODE_INDEX === 1) {
            if (currPage != 1) {
                newData.push(
                    {
                        '@id': `_:resultList${currPage}`,
                        '@type': 'rdf:List'
                    },
                    {
                        '@id': `_:resultList${currPage}`,
                        'rdf:first': { '@id': resultURL },
                        'rdf:rest': { '@id': bnodeString }
                    }
                );
            }
        } else {
            const PREV_BNODE_INDEX = BNODE_INDEX - 1;
            //const prev_node = vocab + "_bnode" + PREV_BNODE_INDEX;
            const prev_node = "_:bnode" + PREV_BNODE_INDEX;
            newData.push({
                "@id": prev_node,
                "rdf:first": { "@id": resultURL },
                "rdf:rest": { "@id": bnodeString }
            });
        }
        BNODE_INDEX++;
    });

    console.log('newData');
    console.log(newData);

    /*if (currPage == nPages) {
        chrome.runtime.sendMessage({
            message: 'LAST PAGE',
            payload: {
                newData: newData,
            }
        })
    } else if (currPage < nPages) {
        chrome.runtime.sendMessage({
            message: 'NEW DATA',
            payload: {
                newData: newData,
            }
        })
    }*/
    chrome.storage.sync.set({
        bNodeIndex: RANK_INDEX
    }).then(
        chrome.runtime.sendMessage({
            message: 'NEW DATA',
            payload: {
                newData: newData,
                nPages: nPages,
                source: 'Google Search'
            }
        })
    );
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === `ADD SCREENSHOT${currPage}`) {
        console.log("Adding page screenshot");
        const ACCESS_TOKEN = request.payload.token;
        const depositId = request.payload.depositId;
        const uploadDestination = request.payload.uploadDestination;

        const sfooter = document.body.querySelector('#sfooter');
        sfooter.style = 'display:none';

        html2canvas(document.body).then(function (canvas) {

            canvas.toBlob(function (blob) {

                // create File variable for screenshot
                const imgFile = new File([blob], `ranking-snapshot-page${currPage}.png`, { type: 'image/png' });

                const formData = new FormData();

                // Upload the screenshot file to the the deposit
                formData.append("file", imgFile);

                fetch(`${uploadDestination}api/deposit/depositions/${depositId}/files`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${ACCESS_TOKEN}`,
                    },
                    body: formData,
                })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log("File uploaded successfully:", data);
                        //if (currPage == nPages) {
                        chrome.runtime.sendMessage({
                            message: "Uploaded Screenshot",
                            payload: {
                                depositId: depositId,
                                ACCESS_TOKEN: ACCESS_TOKEN,
                                nPages: nPages,
                                uploadDestination: uploadDestination,
                            }
                        });

                        sfooter.style = 'display:';
                        //}
                    })
                    .catch((error) => {
                        console.error("Error uploading file:", error);
                    });
            });

        })
    }
})

function hashCode(s) {
    let h = 0, l = s.length, i = 0;
    if (l > 0)
        while (i < l)
            h = (h << 5) - h + s.charCodeAt(i++) | 0;
    return h;
};