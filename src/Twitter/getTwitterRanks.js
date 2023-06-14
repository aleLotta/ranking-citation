import html2canvas from "html2canvas";

//const url = new URL(window.location.href);
//const params = new URLSearchParams(url.search);
//const start = params.get('first');
const start = 1;

//const currPage = ((start - 1) / 10) + 1;
const currPage = 1;
let nPages;

chrome.storage.sync.get('nPages', (items) => {
    nPages = items.nPages;

    console.log('currentPage ' + currPage);

    const results = document.querySelectorAll('.css-1dbjc4n.r-j5o65s.r-qklmqi.r-1adg3ll.r-1ny4l3l:not(:has(.css-1dbjc4n.r-1awozwy.r-18u37iz > svg))');

    let newData = [];
    let BNODE_INDEX = parseInt(start);
    console.log('bnode' + BNODE_INDEX);
    let RANK_INDEX = parseInt(start);
    const vocab = "https://rankingcitation.dei.unipd.it";
    const ontology = vocab + "/ontology/";
    const resource = vocab + "/resource/";

    results.forEach((result) => {

        const title = result.querySelector('div[data-testid="tweetText"]').innerText.replaceAll('\n', ' ');
        const resultURL = result.querySelector('.css-1dbjc4n.r-18u37iz.r-1q142lx > a') ? result.querySelector('.css-1dbjc4n.r-18u37iz.r-1q142lx > a').href :
            result.querySelector('.css-1dbjc4n.r-18u37iz.r-1h0z5md > a').href.replace('/analytics', '');


        function formatDate(dateString) {
            const date = new Date(dateString);
            const options = {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            };
            return date.toLocaleString('en-US', options);
        }

        const inputDate = result.querySelector('time').dateTime;
        const formattedDate = formatDate(inputDate);

        const publicationTime = formattedDate;

        /**  Find a method to add the authors */
        //const authorsList = result.querySelectorAll('.ddmAuthorList>a');
        let authors = [];
        authors.push(result.querySelectorAll('a[role="link"]')[2].textContent);
        //for (let item of authorsList) {
        //    authors.push(item.innerText);
        //}

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
            "rco:publicationTime": publicationTime,
            "rco:currentPage": currPage,
        });

        RANK_INDEX++;

        //const bnodeString = vocab + "_bnode" + BNODE_INDEX;
        const bnodeString = "_:bnode" + BNODE_INDEX;


        // Try with results.indexof(result) == results.length-1
        if (BNODE_INDEX === (results.length) * 1) {
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
    chrome.runtime.sendMessage({
        message: 'NEW DATA',
        payload: {
            newData: newData,
            nPages: 1,
            source: 'Twitter'
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === `ADD SCREENSHOT${currPage}`) {
        console.log("Adding page screenshot");
        const ACCESS_TOKEN = request.payload.token;
        const depositId = request.payload.depositId;
        const uploadDestination = request.payload.uploadDestination;

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
                        if (String(data.status).startsWith('4') || String(data.status).startsWith('5')) {
                            chrome.runtime.sendMessage({
                                message: 'ERROR',
                                status: data.status
                            })

                            console.error(data);
                        } else {
                            console.log("File uploaded successfully:", data);
                            //if (currPage == nPages) {
                            chrome.runtime.sendMessage({
                                message: "Uploaded Screenshot",
                                payload: {
                                    depositId: depositId,
                                    ACCESS_TOKEN: ACCESS_TOKEN,
                                    nPages: 1,
                                    uploadDestination: uploadDestination,
                                }
                            });
                            //}
                        }
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