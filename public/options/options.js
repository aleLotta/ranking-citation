'use strict'

document.addEventListener("DOMContentLoaded", function (event) {

    chrome.storage.sync.get(['accessToken', 'firstName', 'lastName', 'affiliation', "orcid"], function (items) {
        if (Object.keys(items).length !== 0) {
            document.getElementById("atoken").value = items.accessToken;
            document.getElementById("fname").value = items.firstName;
            document.getElementById("lname").value = items.lastName;
            document.getElementById("affiliation").value = items.affiliation;
            document.getElementById("orcid").value = items.orcid;
        }
    });

    document.getElementById("options-form").addEventListener("submit", saveOptions);

    // Get other authors
    chrome.storage.sync.get(['otherAuthors'], function (items) {
        if (Object.keys(items).length !== 0) {
            const otherAuthors = items.otherAuthors.split(";");
            const authorsTable = document.getElementById("authorsTable");
            for (let author of otherAuthors) {
                if (author != "") {
                    const newRow = authorsTable.getElementsByTagName("tbody")[0].insertRow();
                    newRow.innerHTML += '<td>' + author.split(',')[0] + '</td>' +
                        '<td>' + author.split(',')[1] + '</td>' +
                        '<td>' + author.split(',')[2] + '</td>' +
                        '<td><button class="remove-row">Remove</button></td>';
                }
            }
            const removeButtons = document.querySelectorAll('.remove-row');
            removeButtons.forEach(button => {
                button.addEventListener('click', removeAuthor);
            });
        }
    });

    document.getElementById("addAuthors").addEventListener('click', addAuthor);

    // ADD default Keywords
    const defaultKeywords = ["Unipd Ranking Citation Tool", "Ranking Snapshot", "${queryText}", "${searchSystem}"]
    defaultKeywords.forEach(keyword => {
        const list = document.getElementById('keyword-list');
        const item = document.createElement('div');
        item.id = 'keyword-stored';
        const keywordText = document.createElement("span");
        keywordText.style = "margin-right: 5px"
        keywordText.textContent = keyword;
        item.appendChild(keywordText);
        list.appendChild(item);
    });

    chrome.storage.sync.get(['keywords'], function (items) {
        const keyws = items.keywords;
        for (let item of keyws) {
            createKeywordDiv(item);
        }
    });

    document.getElementById("add-keyword").addEventListener('click', addKeyword);

    // Get n of pages to capture
    chrome.storage.sync.get(['nPages'], function (items) {
        if (Object.keys(items).length !== 0) {
            const nPages = items.nPages;
            document.getElementById("n-pages").value = nPages;
        }
    });

    // Get Upload Destination
    chrome.storage.sync.get(['uploadDestination'], function (items) {
        if (Object.keys(items).length !== 0) {
            const uploadDestination = items.uploadDestination;
            if (uploadDestination.includes('sandbox')) {
                document.getElementById('zenodoSandbox').checked = true;
            } else {
                document.getElementById('zenodo').checked = true;
            }
        }
    });

});

let firstLetter;
let inputIdArray = ['affiliation', 'atoken', 'fname', 'lname', 'orcid'];
for (let key of inputIdArray) {
    document.getElementById(key).addEventListener('input', function (event) {
        let enteredText = event.target.value;
        console.log(enteredText);
        if (enteredText.length > 1) {
            if (enteredText.charAt(0) !== firstLetter && enteredText.charAt(1) === firstLetter) {
                console.log(enteredText, '-', firstLetter);
                enteredText = String(enteredText.slice(1)) + String(enteredText.charAt(0));
                event.target.value = enteredText;
                firstLetter = enteredText.charAt(0);
            }
        }
        if (enteredText.length === 1) {
            firstLetter = enteredText;
            console.log('first', firstLetter);
            isCopied = false;
        }
    });
}

function addAuthor() {
    const newAuthor = document.createElement("fieldset");
    newAuthor.id = "newAuthorsFS";
    newAuthor.innerHTML += '<form id="keywordForm">' +
        '<label for="newFname">First name(*):</label><br>' +
        '<input type="text" id="newFname" name="newFname" required><br>' +
        '<label for="newLname">Last name(*):</label><br>' +
        '<input type="text" id="newLname" name="newLname" required><br>' +
        '<label for="newOrcid">ORCID:</label><br>' +
        '<input type="text" id="newOrcid" name="newOrcid"><br>' +
        '<label for="newAffiliation">Affiliation:</label><br>' +
        '<input type="text" id="newAffiliation" name="newAffiliation" value="Unipd"><br><br></br>' +
        '<button type="submit" id="insertAuthor">Insert author</button></form>';
    document.getElementById("addAuthors").insertAdjacentElement('afterend', newAuthor);
    document.getElementById('addAuthors').style = 'display:none';
    //document.getElementById("insertAuthor").addEventListener("click", uploadAuthor);
    document.getElementById('keywordForm').addEventListener('submit', uploadAuthor);
}

function removeAuthor() {
    const rowToRemove = this.parentNode.parentNode;
    rowToRemove.remove();

    let otherAuthors = "";
    const rows = authorsTable.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for (let row of rows) {
        const cells = row.getElementsByTagName("td");
        const name = cells[0].textContent;
        const orcid = cells[1].textContent;
        const affiliation = cells[2].textContent;

        otherAuthors += `${name},${orcid},${affiliation};`;
    }

    chrome.storage.sync.set({
        otherAuthors: otherAuthors
    });
}

function uploadAuthor() {
    const newName = document.getElementById("newFname").value + " " + document.getElementById("newLname").value;
    const newORCID = document.getElementById("newOrcid").value;
    const newAffiliation = document.getElementById("newAffiliation").value;

    const authorsTable = document.getElementById("authorsTable");
    const newRow = authorsTable.getElementsByTagName("tbody")[0].insertRow();
    newRow.innerHTML += '<td>' + newName + '</td>' +
        '<td>' + newORCID + '</td>' +
        '<td>' + newAffiliation + '</td>' +
        '<td><button class="remove-row">Remove</button></td>';

    document.getElementById("newAuthorsFS").remove();

    let otherAuthors = "";
    const rows = authorsTable.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
    for (let row of rows) {
        const cells = row.getElementsByTagName("td");
        const name = cells[0].textContent;
        const orcid = cells[1].textContent;
        const affiliation = cells[2].textContent;

        otherAuthors += `${name},${orcid},${affiliation};`;
    }

    document.getElementById('addAuthors').style = 'display:';
    const removeButtons = document.querySelectorAll('.remove-row');
    removeButtons.forEach(button => {
        button.addEventListener('click', removeAuthor);
    });

    chrome.storage.sync.set({
        otherAuthors: otherAuthors
    });
}

function saveOptions(event) {
    event.preventDefault();
    console.log("saving options");
    let accessToken = document.getElementById("atoken").value;
    let firstName = document.getElementById("fname").value;
    let lastName = document.getElementById("lname").value;
    let affiliation = document.getElementById("affiliation").value;
    let orcid = document.getElementById("orcid").value;
    let keywordsElement = document.getElementsByClassName("keyText");
    let nPages = document.getElementById("n-pages").value;

    let zenodoRadio = document.getElementById('zenodo');
    let zenodoSandboxRadio = document.getElementById('zenodoSandbox');
    let uploadDestination;
    if (zenodoRadio.checked) {
        uploadDestination = 'https://zenodo.org/';
    } else if (zenodoSandboxRadio.checked) {
        uploadDestination = 'https://sandbox.zenodo.org/'
    }

    let keywords = [];
    for (let element of keywordsElement) {
        keywords.push(element.innerText);
    }

    chrome.storage.sync.set({
        accessToken: accessToken,
        firstName: firstName,
        lastName: lastName,
        affiliation: affiliation,
        orcid: orcid,
        keywords: keywords,
        nPages: nPages,
        uploadDestination: uploadDestination,
    }, function () {
        // Notify the user that the options were saved.
        let status = document.querySelectorAll('.status');
        status.forEach(el => el.style = 'display:flex');

        document.getElementsByTagName("fieldset")[0].style = "border: 4px solid green;";
        document.getElementsByTagName("fieldset")[1].style = "border: 4px solid green;";
        document.getElementsByTagName("fieldset")[2].style = "border: 4px solid green;";
        document.getElementsByTagName("fieldset")[3].style = "border: 4px solid green;";
        setTimeout(function () {
            status.forEach(el => el.style = 'display:none');
            document.getElementsByTagName("fieldset")[0].style = "border: 2px solid #ccc;";
            document.getElementsByTagName("fieldset")[1].style = "border: 2px solid #ccc;";
            document.getElementsByTagName("fieldset")[2].style = "border: 2px solid #ccc;";
            document.getElementsByTagName("fieldset")[3].style = "border: 2px solid #ccc;";
        }, 1500);
    });
}

function addKeyword() {
    const input = document.getElementById('keywords');
    const keyword = input.value.trim();
    if (keyword !== '') {
        createKeywordDiv(keyword);
        input.value = '';
    }
}

function createKeywordDiv(keyword) {
    const list = document.getElementById('keyword-list');
    const item = document.createElement('div');
    item.id = 'keyword-stored';
    const keywordText = document.createElement("span");
    keywordText.className = "keyText";
    keywordText.style = "margin-right:5px"
    keywordText.textContent = keyword;
    const removeBtn = document.createElement("i");
    removeBtn.className = "fa fa-remove";
    removeBtn.addEventListener("click", function () {
        item.remove();
    });
    item.appendChild(keywordText);
    item.appendChild(removeBtn);
    list.appendChild(item);
}