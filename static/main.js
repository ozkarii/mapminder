$(document).ready(function(){
    $("#settings-link").click(function(e){
        e.preventDefault();
        $("#settings-popup").show();   // Show the popup
        $(".background").show(); // Show the background div
    });

    $("#close-btn").click(function(e){
        e.preventDefault();
        $("#settings-popup").hide(); // Hide the popup
        $(".background").hide(); // Hide the background div
    });

    $("export-btn").click(export_to_pdf());
});

// saves the bullet points to an array in order [[text, depth]]
function bulletsToArray() {
    // get editor
    const editor = document.querySelector('.ql-editor');
    // get list of bulletpoints
    const bulletElement = editor.querySelector('ul'); 

    if (bulletElement === null) {
        return [];
    }
   
    const bullets = bulletElement.querySelectorAll('li'); 

    if (bullets.length === 0) {
        return [];
    }

    let bulletArray = [];

    for (const bullet of bullets) {
        let underlined = bullet.querySelectorAll("u");
        let nodeText = "";
        for (const u of underlined) {
            nodeText += " " + u.textContent; 
        }
        let depth = parseInt(bullet.className.replace("ql-indent-", ""));
        if (isNaN(depth)) {
            depth = 0;
        }
        bulletArray.push([nodeText, depth]);
    }

    return bulletArray;
}

// converts the array of bulletponts to a nested object {name: "", children: [{...}]}
function convertToObject(bulletPoints, rootName) {
    let result = {
      name: rootName,
      children: []
    };
  
    for (const [text, depth] of bulletPoints) {
      const item = { name: text };
  
      let parent = result;
      for (let i = 0; i < depth; i++) {
        if (!parent.children || !parent.children.length) {
          throw new Error(`Can't find parent for depth ${depth}`);
        }
        parent = parent.children[parent.children.length - 1];
      }
  
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(item);
    }
  
    return result;
}

// init a new instance of quill editor
let quill = new Quill('#editor', {
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ header: [1, 2, false] }],
            [{ 'font': [] }],
            ['blockquote', 'code-block', 'link', 'image'],
            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        ],
    },
    theme: 'snow'
});
quill.root.setAttribute('spellcheck', false)

document.getElementById('editor').addEventListener('input', function() {
    
    const bullets = bulletsToArray();
    if (bullets.length === 0) {
        d3.select('#mindmap').selectAll('*').remove();
        return;
    }
    
    let bulletStart = document.querySelector("#editor ul");
    try {
        let rootName = bulletStart.previousElementSibling.textContent;    
        if (rootName.startsWith("*")) {
            var data = convertToObject(bullets, rootName.replace("*", ""));
        }
        else {
            var data = convertToObject(bullets, "root");
        }
    } catch (error) {
        var data = convertToObject(bullets, "root");
    }
    
    // Clear the existing visualization
    d3.select('#mindmap').selectAll('*').remove();

    const svg = d3.select('#mindmap').append('svg')
        .attr('width', 800)
        .attr('height', 600);

    const g = svg.append('g')
        .attr('transform', 'translate(40,0)');

    const treeLayout = d3.tree().size([600, 500]);

    const rootD3 = d3.hierarchy(data);
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

window.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.altKey && e.key === "n") {
        e.preventDefault();
        // Get the current cursor position
        let cursorPosition = quill.getSelection().index;
        // Insert '**' at the cursor position
        quill.insertText(cursorPosition, '**');
        // Move the cursor in between the inserted string
        quill.setSelection(cursorPosition + 1);
    }
});
