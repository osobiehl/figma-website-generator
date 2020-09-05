console.log("hello,world!");
const Config = require('./UserConfig.json');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const https = require('https');
fs = require('fs');

var req = new XMLHttpRequest();
var HTMLHEAD = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <link rel="stylesheet" href="index.css">
        <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link href="https://fonts.googleapis.com/css?family=Muli:500,600,700,800,900&display=swap" rel="stylesheet">
</head>
<body>`
var CSSHEAD;


const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})
/*
    Global Variables b/c I'm lazy
 */
var key = Config.key;
var name = Config.key;
var modifier = Config.mod
var imageStringArray = [];
const outputHTML = "index.html";
const outputCSS = "index.css";
var min_x_position, min_y_position;
var max_x_position, max_y_position;
//used for percentage calculations
var max_width;
//also if using heights as a percentage is enabled
var max_height;



req.open('GET', 'https://api.figma.com/v1/files/'+name + modifier, true);
req.setRequestHeader('X-Figma-Token', Config.token);
console.log("request sent!");
req.send();
readline.close();


req.onload=function(){
    let resp = req.responseText;
    var incomingJson = JSON.parse(resp);
    initializeRender(incomingJson);
}
function AddToImageString(node){
    if (node.absoluteBoundingBox !== undefined && Config.FindLargestCoords === true){
        let bb = node.absoluteBoundingBox;
        if (bb.x > max_x_position)
            max_x_position = bb.x;
        if (bb.x < min_x_position)
            min_x_position = bb.x;
        if (bb.y > max_y_position)
            max_y_position = bb.y;
        if (bb.y < min_y_position)
            min_y_position = bb.y;
    }
    if(node.fills === undefined)
        return;
    else if (node.fills[0] === undefined)
        return;
    else if (node.fills[0].type === "IMAGE") {
        imageStringArray.push("," + node.id)
    }
}
/* writes HTML and CSS corresponding to a node*/

function stderr(err){
    if (err) return console.log(err);
}

function initializeRender(incomingJson){

    fs.writeFileSync(outputHTML, HTMLHEAD, stderr);

    let JSONRoot = incomingJson.nodes;
    for (var  id in JSONRoot){
        max_x_position = -1999999;
        max_y_position = -1999999;
        min_y_position = 1999999;
        min_x_position = 1999999;

        min_y_position = JSONRoot[id].document.absoluteBoundingBox.y;
        min_x_position = JSONRoot[id].document.absoluteBoundingBox.x;

        treeIteration(JSONRoot[id].document, 0, AddToImageString);
        imageStringArray[0] = imageStringArray[0].substring(1);
        // calls GET for all requested images
        const imageQueryString = imageStringArray.join('');
        console.log(imageQueryString);
        let img_req = new XMLHttpRequest();
        img_req.open('GET', "https://api.figma.com/v1/images/"+key+"?ids="+imageQueryString, false);
        img_req.setRequestHeader('X-Figma-Token', Config.token);
        img_req.send();
        let test = JSON.parse(img_req.responseText);
        imageMap = (JSON.parse(img_req.responseText));
        console.log(imageMap);
        if (Config.UseWidthPercentage === true) {
            max_width = JSONRoot[id].document.absoluteBoundingBox.width;
             max_height = JSONRoot[id].document.absoluteBoundingBox.height;
            fs.appendFileSync(outputHTML, `<div class="content-wrapper">`, stderr);
            CSSHEAD = `.content-wrapper{
max-width: ${max_width}px;
height: ${max_height}px;
overflow: hidden;
position: relative;
margin-left: auto;
}`
            fs.writeFileSync(outputCSS, CSSHEAD, stderr);
            treeIteration(JSONRoot[id].document, 0, WriteOutputPercentage);
        }
        else {
            //now creates static html page
            treeIteration(JSONRoot[id].document, 0, WriteOutput);
        }
    }




}
function treeIteration(data, count, function_ptr){
    //todo: check for null children
    if (data.children !== undefined)
        data.children.forEach( (node) =>{
            treeIteration(node, count + 1, function_ptr);

        });
    if (data !== undefined)
        function_ptr(data);
}

function WriteOutput(node) {
    let HtmlText;
    let CSSText;
    var temp = node.id;
    temp = temp.replace(/:/g, '-');
    temp = temp.replace(/;/g, '-');
    const parsedId = 'css-' + temp;
    const wtf = node.id;
    console.log("node is: " + node.id);
    let acceptedCase = false;
    if (node.fills !== undefined && node.fills[0] !== undefined && node.fills[0].type === "IMAGE") {

        HtmlText = `<div class="${parsedId}">
<img src="${imageMap.images[wtf]}" alt="" class="${parsedId}-img"> 
</div>`;
        acceptedCase = true;
    }
    else if (node.type !== undefined && node.type === "TEXT") {
        HtmlText = `<div class = "${parsedId}">
${node.characters}
</div>`;
        acceptedCase = true;
    }
    else if (node.type === "GROUP" || node.type === "RECTANGLE" || node.type === "LINE"){
        let color = null;
        if (node.fills && node.fills[0])
            color = node.fills[0].color;
        HtmlText = `<div class=${parsedId}></div>`
        acceptedCase = true;
    }
    //CSS constructor case "business bus"
    if (acceptedCase === true){

        CSSText = `.${parsedId}{
position: absolute;`
            //case: bounding box is defined
            if (node.absoluteBoundingBox !== undefined) {
                CSSText += `top: ${1 * node.absoluteBoundingBox.y -min_y_position}px;
left: ${1 * node.absoluteBoundingBox.x -min_x_position}px;
width: ${node.absoluteBoundingBox.width}px;
height: ${node.absoluteBoundingBox.height}px;\n`;
            }
            //case: style is defined
        if (node.style !== undefined){
        CSSText +=`font-weight: ${node.style.fontWeight};
        font-size: ${node.style.fontSize}px;
        line-height: ${node.style.lineHeightPx}px ;
        font-family: ${node.style.fontFamily === undefined ? "inherit" : node.style.fontFamily};\n`;
        switch (node.style.textAlignHorizontal){
            case("CENTER"):
                CSSText += 'text-align: center;'
                break;
            case("LEFT"):
                CSSText += 'text-align: left;'
                break
            case(undefined):
                break;
            default:
                break;
        }

            }
        //case: defining the color / background color and opacity

        if (node.fills !== undefined && node.fills.length > 0 && node.fills[0].color !== undefined){
            let color = node.fills[0].color;
            let opacity = node.fills[0].opacity;
            CSSText += `${node.type === "TEXT"? 'color: ': 'background-color: '} rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${opacity === undefined? color.a : opacity});\n`

        }
        //case: border is defined (currently only solid border);
        if (node.strokes !== undefined && node.strokes.length > 0){
            let strokes = node.strokes[0]
            CSSText += `border: ${node.strokeWeight}px solid rgba(${strokes.color.r * 255}, ${strokes.color.g * 255}, ${strokes.color.b * 255}, ${strokes.color.a});\n`;
        }
        //case: corner radius is defined;
        if (node.cornerRadius !== undefined ){
            CSSText +=  `border-radius: ${node.cornerRadius}px;\n`
        }
        CSSText +='\n}';
        fs.appendFileSync(outputHTML, HtmlText, stderr);
        fs.appendFileSync(outputCSS, CSSText, stderr);
    }
}

function WriteOutputPercentage(node) {
    let HtmlText;
    let CSSText;
    var temp = node.id;
    temp = temp.replace(/:/g, '-');
    temp = temp.replace(/;/g, '-');
    const parsedId = 'css-' + temp;
    const wtf = node.id;
    console.log("node is: " + node.id);
    let acceptedCase = false;
    if (node.fills !== undefined && node.fills[0] !== undefined && node.fills[0].type === "IMAGE") {

        HtmlText = `<div class="${parsedId}">
<img src="${imageMap.images[wtf]}" alt="" class="${parsedId}-img"> 
</div>`;
        acceptedCase = true;
    }
    else if (node.type !== undefined && node.type === "TEXT") {
        HtmlText = `<div class = "${parsedId}">
${node.characters}
</div>`;
        acceptedCase = true;
    }
    else if (node.type === "GROUP" || node.type === "RECTANGLE" || node.type === "LINE"){
        let color = null;
        if (node.fills && node.fills[0])
            color = node.fills[0].color;
        HtmlText = `<div class=${parsedId}></div>`
        acceptedCase = true;
    }
    //CSS constructor case "business bus"
    if (acceptedCase === true){
        let ImageCSS = '';
        CSSText = `.${parsedId}{
position: absolute;`
        //case: bounding box is defined
        if (node.absoluteBoundingBox !== undefined) {
            CSSText += `top: ${1 * node.absoluteBoundingBox.y -min_y_position}px;
left: ${(1 * node.absoluteBoundingBox.x -min_x_position) / max_width * 100}%;
width: ${node.absoluteBoundingBox.width /max_width * 100}%;
height: ${node.absoluteBoundingBox.height}px;\n`;
        }
        //case: style is defined
        if (node.style !== undefined){
            CSSText +=`font-weight: ${node.style.fontWeight};
        font-size: min(${node.style.fontSize}px, ${node.style.fontSize / max_width * 200}vh);
        line-height: ${node.style.lineHeightPx}px ;
        font-family: ${node.style.fontFamily === undefined ? "inherit" : node.style.fontFamily};\n`;
            switch (node.style.textAlignHorizontal){
                case("CENTER"):
                    CSSText += 'text-align: center;'
                    break;
                case("LEFT"):
                    CSSText += 'text-align: left;'
                    break
                case(undefined):
                    break;
                default:
                    break;
            }

        }
        //case: defining the color / background color and opacity

        if (node.fills !== undefined && node.fills.length > 0){
            if (node.fills[0].color !== undefined) {
                let color = node.fills[0].color;
                let opacity = node.fills[0].opacity;
                CSSText += `${node.type === "TEXT" ? 'color: ' : 'background-color: '} rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${opacity === undefined ? color.a : opacity});\n`
            }
            if (node.fills[0].type === "IMAGE"){
                ImageCSS = `.${parsedId} img{
width: 100%;
height: 100%;                               
}`
            }

        }
        //case: border is defined (currently only solid border);
        if (node.strokes !== undefined && node.strokes.length > 0){
            let strokes = node.strokes[0]
            CSSText += `border: ${node.strokeWeight}px solid rgba(${strokes.color.r * 255}, ${strokes.color.g * 255}, ${strokes.color.b * 255}, ${strokes.color.a});\n`;
        }
        //case: corner radius is defined;
        if (node.cornerRadius !== undefined ){
            CSSText +=  `border-radius: ${node.cornerRadius}px;\n`
        }

        //case: our group should have a fixed size
        CSSText +='}\n';
        CSSText += ImageCSS;
        fs.appendFileSync(outputHTML, HtmlText, stderr);
        fs.appendFileSync(outputCSS, CSSText, stderr);
    }
}


