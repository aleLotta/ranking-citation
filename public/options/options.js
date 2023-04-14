'use strict'

document.addEventListener("DOMContentLoaded", function (event) {
    alert("content loaded");
    document.getElementById("options-form").addEventListener("submit", saveOptions);
});

function saveOptions() {
    var accessToken = document.getElementById("atoken").value;
    var firstName = document.getElementById("fname").value;
    var lastName = document.getElementById("lname").value;
    var affiliation = document.getElementById("affiliation").value;

    chrome.storage.sync.set({
        accessToken: accessToken,
        firstName: firstName,
        lastName: lastName,
        affiliation: affiliation
    }, function () {
        // Notify the user that the options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 1500);
    });
}