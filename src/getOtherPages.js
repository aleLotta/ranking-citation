import html2canvas from "html2canvas";

const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);
const start = params.get('start');

const currPage = (start / 10) + 1;
let nPages;

chrome.storage.sync.get('nPages', (items) => {
    nPages = items.nPages;

    console.log('currentPage ' + currPage);

    const results = document.querySelectorAll('.gs_r.gs_or.gs_scl');

    let newData = [];
    let BNODE_INDEX = (10 * (currPage - 1)) + 1;
    console.log('bnode' + BNODE_INDEX);
    let RANK_INDEX = (10 * (currPage - 1)) + 1;
    const vocab = "https://rankingcitation.dei.unipd.it";
    const ontology = vocab + "/ontology/";
    const resource = vocab + "/resource/";

    ////// To edit /////
    const timestamp = new Date();
    let resultListId = "resultList[" + timestamp + "]";
    resultListId = hashCode(resultListId);

    results.forEach((result) => {

        if (result.innerText.startsWith('[CITATION]')) return;
        const title = result.querySelector('h3>a').innerText;
        const resultURL = result.querySelector('h3>a').href;
        const context_el = result.querySelector('div.gs_a').innerText;
        const splitContext = context_el.split('-');
        const tempString = splitContext[splitContext.length - 2];
        const publicationYear = parseInt(tempString.slice(tempString.length - 5, tempString.length - 1));

        //const linked_authors = result.querySelectorAll('.gs_a>a');
        const authors = splitContext[0].split(',').map((element) => {
            element = element.trim();
            element = element.replaceAll('…', '');
            return element.replaceAll('&nbsp', '')
        });

        newData.push({
            //"@id": vocab + "result" + RESULT_INDEX,
            "@id": resultURL,
            "rdfs:label": [{
                "@value": "rank" + RANK_INDEX,
            }],
            "@type": "cro:SearchResult",
            "schema:title": title,
            "schema:url": resultURL,
            "cro:authors": authors,
            "cro:publicationYear": publicationYear,
        });

        RANK_INDEX++;

        //const bnodeString = vocab + "_bnode" + BNODE_INDEX;
        const bnodeString = "_:bnode" + BNODE_INDEX;


        // Try with results.indexof(result) == results.length-1
        if (BNODE_INDEX === (results.length) * nPages) {
            const PREV_BNODE_INDEX = BNODE_INDEX - 1;
            //const prev_node = vocab + "_bnode" + PREV_BNODE_INDEX;
            const prev_node = "_:bnode" + PREV_BNODE_INDEX;
            newData.push({
                "@id": prev_node,
                "rdf:first": { "@id": resultURL },
                "rdf:rest": { "@id": "rdf:nil" }
            });
            return;
        }

        newData.push({
            "@id": bnodeString,
            "@type": "rdf:List"
        });

        if (BNODE_INDEX === 1) {
            /*newData.push({
                "@id": resource + resultListId,
                "rdf:first": { "@id": resultURL },
                "rdf:rest": { "@id": bnodeString }
            });*/
        }
        else {
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

    console.log(newData);

    /*if (currPage > 2) {
        chrome.storage.local.get('newData', function (items) {
            let prevData = items.newData;
            for (let j in newData) {
                prevData.push(newData[j]);
            }
            newData = prevData;
            chrome.storage.local.set({
                newData: newData
            })
        })
    } else {
        chrome.storage.local.set({
            newData: newData
        })
    }*/

    if (currPage == nPages) {
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
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === `ADD SCREENSHOT${currPage}`) {
        console.log("Adding page screenshot");
        const ACCESS_TOKEN = request.payload.token;
        const depositId = request.payload.depositId;

        html2canvas(document.body).then(function (canvas) {

            canvas.toBlob(function (blob) {

                // create File variable for screenshot
                const imgFile = new File([blob], `ranking-snapshot-page${currPage}.png`, { type: 'image/png' });

                const formData = new FormData();

                // Upload the screenshot file to the the deposit
                formData.append("file", imgFile);

                fetch(`https://sandbox.zenodo.org/api/deposit/depositions/${depositId}/files`, {
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
                                }
                            });
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