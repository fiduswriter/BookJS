/*
 * (c) 2012 Johannes Wilm and Philip Schatz. Freely available under the AGPL. For further details see LICENSE.txt
 */



// Some timing stats: the time it takes to add each group (in seconds)
// bulk adding 50 pages at a time: 7+10+12+19+24+37+22+40+44+48
// bulk adding 100 pages at a time: 8+17+22+35+44
var bulkPagesToAdd = 100; // For larger books add many pages at a time so there is less time spent reflowing text


function pageCounter(show)
{
this.value=1;
this.show = function() {
if (show===undefined) {
        return this.value;
} else {
        return show(this.value);
}
}
}

var arabPageCounter = new pageCounter();
var romanPageCounter = new pageCounter(romanize);

function addPage(flowTo,pageCounter) {
    $('#'+flowTo).append('<div class="page"><div class="contents"></div><div class="pagenumber">' + pageCounter.show() + '</div></div>');
    pageCounter.value++;
}

function setupDocument() {
    $('body').wrapInner('<div id="bodyraw" />');
    $('body').append('<div id="frontmatterraw" />');
    $('body').append('<div id="layout"><div id="frontmatter"/><div id="body"/></div>');
    addPage('body',arabPageCounter);
    addPage('frontmatter',romanPageCounter);
}


// If text overflows from the region add more pages and then remove any empty ones
function addPagesIfNeeded(flowName, flowTo, pageCounter) {
    namedFlow = document.webkitGetFlowByName(flowName);

    // TODO: We use firstEmptyRegionIndex as overset gives us incorrect values in current Chromium.
    if (namedFlow.firstEmptyRegionIndex == -1) {
        // Add several pages at a time
        // console.log(new Date());
        for (var i = 0; i < bulkPagesToAdd; i++) {
            addPage(flowTo, pageCounter);
        }

        // The browser becomes unresponsive if we loop
        // Instead, set a timeout
        setTimeout(addPagesIfNeeded(flowName, flowTo, pageCounter), 1);
    } else {
        // Remove the empty pages (up to bulkPagesToAdd - 1)
        // (empty page needed to test if firstEmptyRegionIndex == -1 )
        while (namedFlow.firstEmptyRegionIndex != -1) {
            $('#' + flowTo + ' .page:last').detach();
            pageCounter--;
        }
    }
}

$(document).ready(function () {
    setupDocument();
    addPagesIfNeeded('body', 'body', arabPageCounter);
    //Done flowing body pages; calculate the TOC
    addFrontMatter();
    addPagesIfNeeded('frontmatter', 'frontmatter', romanPageCounter);
});

function addFrontMatter() {
    $('#frontmatterraw').append('<h1>Booktitle</h1> <p>by Author</p><br class="pagebreak">');
    $('#frontmatterraw').append(tocPage());
}

function tocPage() {
    var tocList = buildToc();
    var tocContents = '<h2>Table of Contents</h2>';

    $.each(tocList, function (index, headline) {
        tocContents += '<div class="toc-entry">' + headline.text + ' ' + headline.pagenumber + '</div>';
    });

    return tocContents;
}

function buildToc() {
    var namedFlow = document.webkitGetFlowByName("body");
    var headlinePageList = [];
    $('#bodyraw h1').each(function () {
        headlineContentDiv = namedFlow.getRegionsByContent(this)[0];
        headlinePagenumber = $(headlineContentDiv).parent().find('.pagenumber').text();
        headlineText = $(this).text();
        headlinePageList.push({
            'text': headlineText,
            'pagenumber': headlinePagenumber
        });
    });
    return headlinePageList;

}