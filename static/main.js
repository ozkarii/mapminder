function formatNode(string) {
    return string.replace(/-/g, "").replace(/\n/g, "");
}

function readData(text) {
    let editorLines = text.split('\n')
    let root = { name: formatNode(editorLines[0]), children: [] };
    let nodeStack = [root];

    for (let i = 1; i < editorLines.length; i++) {
        let line = editorLines[i];
        if (!line.startsWith("-")) {
            continue;
        }
        let node = { name: formatNode(line), children: [] };
        let depth = (line.match(/-/g) || []).length;

        while (nodeStack.length > depth) {
            nodeStack.pop();
        }

        nodeStack[nodeStack.length - 1].children.push(node);
        nodeStack.push(node);
    }

    return root;
}


document.getElementById('text-editor').addEventListener('input', function() {
    var text = document.getElementById('text-editor').value;
    var root = readData(text);

    // Clear the existing visualization
    d3.select('#mindmap').selectAll('*').remove();

    const svg = d3.select('#mindmap').append('svg')
        .attr('width', 800)
        .attr('height', 600);

    const g = svg.append('g')
        .attr('transform', 'translate(40,0)');

    const treeLayout = d3.tree().size([400, 400]);

    const rootD3 = d3.hierarchy(root);
    treeLayout(rootD3);

    const links = g.selectAll('.link')
        .data(rootD3.descendants().slice(1))
        .enter().append('path')
        .attr('class', 'link')
        .attr('d', function(d) {
            return "M" + d.y + "," + d.x
                + "C" + (d.y + d.parent.y) / 2 + "," + d.x
                + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
                + " " + d.parent.y + "," + d.parent.x;
        });

    const nodes = g.selectAll('.node')
        .data(rootD3.descendants())
        .enter().append('g')
        .attr('class', function(d) { 
            return "node" + (d.children ? " node--internal" : " node--leaf"); })
        .attr('transform', function(d){ 
            return "translate(" + d.y + "," + d.x + ")";});

    nodes.append('circle')
        .attr('r', 10);

    nodes.append('text')
        .attr('dy', 3)
        .attr('x', function(d) { return d.children ? -12 : 12; })
        .style('text-anchor', function(d) { 
            return d.children ? 'end' : 'start'; })
        .text(function(d) { return d.data.name; });
});