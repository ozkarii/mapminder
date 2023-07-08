function formatNode(string) {
    return string.replace(/-/g, "").replace(/\n/g, "");
}

function readGraph(editorLines) {
    let graph = new Map();
    let previousLine = null;

    for (let i = 0; i < editorLines.length; i++) {
        let line = editorLines[i];
        if (!line.startsWith("-") && previousLine && previousLine.startsWith("-")) {
            continue;
        }
        let node = formatNode(line);
        graph.set(node, []);
        if (previousLine === null) {
            // pass
        } else if ((previousLine.match(/-/g) || []).length < (line.match(/-/g) || []).length) {
            let previousNode = formatNode(previousLine);
            graph.get(previousNode).push(node);
        } else if ((previousLine.match(/-/g) || []).length >= (line.match(/-/g) || []).length) {
            for (let j = i; j >= 0; j--) {
                if ((line.match(/-/g) || []).length - (editorLines[j].match(/-/g) || []).length === 1) {
                    graph.get(formatNode(editorLines[j])).push(node);
                    break;
                }
            }
        }
        previousLine = line;
    }

    return graph;
}

function textToArray() {
    var text = document.getElementById('text-editor').value;
    var editorLines = text.split('\n');
    return editorLines;
}

document.getElementById('text-editor').addEventListener('input', function() {

    var graph = readGraph(textToArray());
    console.log(graph);
    d3.select("#content")
        .selectAll("div")
        .data(graph.keys())
        .enter()
        .append("div")
        .text((d, i) => d);
    
});

// // example of text file lines
// let fileLines = [
//     "-cell\n",
//     "--nucleus\n",
//     "---chromosome\n",
//     "----dna\n",
//     "----histones\n",
//     "--cytoplasm\n",
//     "---ribosome\n"
// ];
