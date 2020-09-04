
function WriteOutput(node) {
    let HtmlText;
    let CSSText;
    var temp = node.id.replace(':', '-');
    temp = temp.replace(';', '-');
    const parsedId = 'css-' + temp;
    console.log("node is: " + node.id);
    if (node.fills === undefined || node.fills[0] === undefined)
        return;
    if (node.fills[0].type === "IMAGE") {
        const wtf = node.id;
        console.log(wtf);
        HtmlText = `<div class="${parsedId}">
<img src="${imageMap.images[wtf]}" alt="" class="${parsedId}-img"> 
</div>`;
        CSSText = `.${parsedId}{
position: absolute;
top: ${ 1* node.absoluteBoundingBox.y + 3000 + 1443}px;
left: ${1 * node.absoluteBoundingBox.x + 4332.7460937}px;
width: ${node.absoluteBoundingBox.width}px;
height: ${node.absoluteBoundingBox.height}px;
}
`;
    }
    else if (node.type !== undefined && node.type === "TEXT") {
        let color = null;
        if (node.fills && node.fills[0])
            color = node.fills[0].color;

        CSSText = `.${parsedId}{
position: absolute;
top: ${1 * node.absoluteBoundingBox.y + 3000 + 1443}px;
left: ${1 * node.absoluteBoundingBox.x + 4332.7460937}px;
width: ${node.absoluteBoundingBox.width}px;
height: ${node.absoluteBoundingBox.height}px;
font-weight: ${node.style.fontWeight};
font-size: ${node.style.fontSize}px;
line-height: ${node.style.lineHeightPx}px ;
font-family: ${node.style.fontFamily === undefined? "inherit": node.style.fontFamily};
${ color? `color: rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`: '' };

            
}`
        HtmlText = `<div class = "${parsedId}">
${node.characters}
</div>`;
    }
    else if (node.type === "GROUP"){
        let color = null;
        if (node.fills && node.fills[0])
            color = node.fills[0].color;
        HtmlText = `<div class=${parsedId}></div>`
        CSSText = `.${parsedId}{
position: absolute;
top: ${1 * node.absoluteBoundingBox.y + 3000 + 1443}px;
left: ${1 * node.absoluteBoundingBox.x + 4332.7460937}px;
width: ${node.absoluteBoundingBox.width}px;
height: ${node.absoluteBoundingBox.height}px;
${ color? `color: rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`: '' };
}`;

    }

    if (node.fills[0] !== undefined)
        if ( node.fills[0].type === "IMAGE" || (node.type !== undefined && (node.type === "TEXT" || node.type==="GROUP") ) ){
            fs.appendFileSync(outputHTML, HtmlText, stderr);
            fs.appendFileSync(outputCSS, CSSText, stderr);
        }

}

module.exports = WriteOutput;
