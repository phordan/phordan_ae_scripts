// Phil's Font Wrangler.jsx v1.0.1
// lists fonts used in a comp, selection, or entire project

// limitation: can only look at font set on first character of text layer 
// limitation: cannot look at fonts set by effects like Numbers, Red Giant effects, etc.

function fontWrangler(thisObj) {

var compDropdown, fontList;
var projectComps = [];
var searchScope = "project"; 

function buildUI() {
    var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Font Wrangler", undefined, {resizeable: true});
    panel.orientation = "column";
    panel.spacing = 8;
    panel.margins = 8;
    panel.preferredSize.width = 420;

    // Scope selection group
    var scopeGroup = panel.add("group");
    scopeGroup.alignment = ["fill", "top"];
    scopeGroup.add("statictext", undefined, "Scope:");
    
    // Add radio buttons for search scope
    var compRadio = scopeGroup.add("radiobutton", undefined, "Dropdown Comp");
    var selectionRadio = scopeGroup.add("radiobutton", undefined, "Proj Panel Selection");
    var projectRadio = scopeGroup.add("radiobutton", undefined, "Entire Project");
    projectRadio.value = true;
    
    compRadio.onClick = function() {
        searchScope = "comp";
        compDropdown.enabled = true;
    };
    
    selectionRadio.onClick = function() {
        searchScope = "selection";
        compDropdown.enabled = false;
    };
    
    projectRadio.onClick = function() {
        searchScope = "project";
        compDropdown.enabled = false;
    };
    
    // Comp selection group
    var selectCompGroup = panel.add("group");
    selectCompGroup.alignChildren = "center";
    selectCompGroup.alignment = ["fill", "top"];
    selectCompGroup.add("statictext", undefined, "Select Composition:");
    compDropdown = selectCompGroup.add("dropdownlist", undefined, []);
    compDropdown.alignment = ["fill", "auto"];
    compDropdown.preferredSize.width = 260;
    compDropdown.enabled = false; // because project is default

    
    var iconNormal_imgString = "%C2%89PNG%0D%0A%1A%0A%00%00%00%0DIHDR%00%00%00%20%00%00%00%20%08%06%00%00%00szz%C3%B4%00%00%00%09pHYs%00%00%0B%13%00%00%0B%13%01%00%C2%9A%C2%9C%18%00%00%00%01sRGB%00%C2%AE%C3%8E%1C%C3%A9%00%00%00%04gAMA%00%00%C2%B1%C2%8F%0B%C3%BCa%05%00%00%02qIDATx%01%C3%ADV%C3%8B%C2%B1%C3%9A0%14%15%C3%9F%05l%C3%8C%00%7B%C2%97%40%07%C2%81%05%C2%BFa%C3%B1%C2%A0%02%1E%15%C2%84W%01PA%C3%A8%C3%A0%C2%85%0AL%16%C3%80%00%C2%8B%40%07%C3%AE%20.%C2%80%C3%9F%C2%82%1D%03%C3%A4%C3%9C%C2%8C%C3%84%C3%A8%19%C3%892%C2%99%C2%B7%C3%88L83%C2%B2l%C3%A9Z%C3%B7%C3%A8%C3%BE%24%C3%86%C2%9Ex%C3%A2%7FG%24%C2%8C%C3%90l6%2BF%22%C2%91%C3%B6%C3%B5z%1D%C3%94%C3%ABu%2FHv%C2%B1X%0C!%C3%B7U3%3D%C2%ACV%C2%ABo%C3%B2%40%C2%9C%05%C3%80q%1C%2B%C2%9DN%C2%BFc%C3%81%C2%A64%C3%9C%09%C3%BA'%409%C2%A1%C2%8B%16%C2%8E%00vmG%C2%A3%C3%91%C2%9FX%C3%90%16c%C2%B0%C3%82%C2%8A%3D%0E%0F%C3%BFyX%C3%A7%C2%80%C2%B6%C3%B2Oj%09%40%C2%B9%C2%83%C3%8E%C2%96%16y%C2%ADT*kYf%C2%BB%C3%9D%C3%B6!w%C3%8Dd2%03%C2%A6%C2%87u%3A%C2%9D%C3%9E%1A%C2%8D%C2%86%C2%AB%C3%94%C2%A3%1A%C2%9C%C3%8F%C3%A7%7Dt%05%C2%A1%C3%BCr%C2%B9%C2%94%C3%BC%C3%8A7%C2%9BM%13%C2%A4z%C3%98U%7F%C2%BF%C3%9F%C2%B7%C3%BDk%60%C3%AE%20%08%C3%84%C3%A3q%C2%87%2C%1A%C2%8A%00%17l%C2%8BEH%C2%B9%26%C3%B0%2C%16%00%C3%BC7F7%C3%A4%C2%9F%C3%A4%C3%8Eo%C2%A1%08%00E%C3%86M%C2%8F%C3%9D%0DMQ%1F%C2%84d2I%C2%AE%C3%B1%C3%B8gs2%C2%99%14%C2%8C%04b%C2%B1%C3%98%C3%8D%C2%9C%C3%98%C3%85%C2%88%3D%08%C2%90%C3%BEN%3D%05l%C2%A9T%22%0B%C3%9E%C2%B2%06%C2%AEx%C3%B1%C3%8B%C2%AB%C2%82P%C2%B0t%C3%BFf%C3%B7%C2%B5Z%C2%8D%14%C3%9E%C2%94b%C2%8D%15j%03e%C2%80%C2%85V%C3%84%C3%90%C2%87%C2%80%C2%BD%C2%B3%00%09%C3%B2%C3%9Ec%C2%9F%07%C2%8F%1E%C2%B0%C2%8A%C3%99%05%12%0E%01s~%C2%82%5E%C2%90%2C%C3%9C%20R%C3%90%0AC%C3%80%C2%A3%C2%87%C2%8A%C2%AD%C2%8C%7C%3E%C2%BF%C2%82%0C%C2%95%C3%A8%22%C3%AA%C3%80%3AH%16%19%60k%C3%A7%14c%C2%82m%C2%81J%C2%B1%18%C2%9CN%C2%A7M%7F.%C2%93b%C2%93r%C2%82TM%5D%23%01%C2%B9%C3%9C%C2%A6R%C2%A9%3Fu%7D%C2%B9%5C%C3%B6%C2%90%1D%0E%C2%95f%C3%B6%208i%C2%9B%131%13H%24%12%23%C2%A9%C2%8Aui%C2%81%C3%B3%C3%B9l%C3%B3o%C3%913T%3F%7B%C2%B7%C3%9B%C3%BD%C2%A2%C2%86wmQ%02%C3%B1%C2%9E%C3%B4%3E6%12%C2%A0%C3%9C%05%01Q%C3%81%2C%C3%9A%C2%B5%C3%8A%C2%87%20U%C3%A0%C2%84%C2%A8%7Da%0A%C2%90%C3%9B%C2%B0%C3%ABW%C3%BE%C3%A9%C2%95%C3%8B%C3%A5%1FF%02%04%08%0E%24W%C3%98%3C%7F%3F%20%C2%97%C3%8B%C2%8D%C3%A9%1C%C2%A0%C2%868%C2%B8%5B%C2%98%C3%AE%10(%3C%C3%AF%C3%92P_%C2%A5K%7B%1Ab%C2%87%1D%C3%AEs%5B'%C2%93%C3%8Df%C2%95%C2%A7%20%3F%C3%8C%C3%A8%C2%A0%C2%BA)%C3%87Ed%14%C2%8A%C2%80%C3%A1Fc%04%05%2C%C3%B2%C2%BE'%0D%C3%91-H%7B%5C%C2%AB%5C%C3%90f%C2%9F%00%0Adl%C2%A4%C3%AB%C2%BF%C2%82%C3%B9qg%01%C3%BC%C3%94A%7B%C3%91%C3%88%C2%BB%C3%8C%00%C2%8A%1FX%C3%81%3D%1E%C2%8F%C3%ABV%C2%ABu%60O%3C%C3%B1%C2%AF%C3%A37%C3%9B%C3%A5%1C%C3%B1%C2%A0%18%C3%909%00%00%00%00IEND%C2%AEB%60%C2%82"; 

    var iconNormal = File.decode(iconNormal_imgString);
    
    var refreshDropdownButton = selectCompGroup.add("iconbutton", undefined, iconNormal, {style: "toolbutton"});
    refreshDropdownButton.preferredSize = [32,32];

    refreshDropdownButton.helpTip = "Use this to refresh if you've:\n— Switched to a different project \n— Added or deleted any comps.";
    
    refreshDropdownButton.onClick = function() {
        populateCompDropdown();
    };
    
    // Show fonts button in its own row
    var showFontsGroup = panel.add("group");
    showFontsGroup.alignment = ["fill", "top"];
    var searchButton = showFontsGroup.add("button", undefined, "Show Fonts");
    searchButton.alignment = ["fill", "center"];

    // Font list with columns
    fontList = panel.add("listbox", undefined, [],
        {numberOfColumns: 3, showHeaders: true,
        columnTitles: ['Comp', 'Layer', 'Font Name']});
    fontList.alignment = ["fill", "fill"];
    fontList.preferredSize.height = 200;

    // Initialize the UI
    populateCompDropdown();

    // Search button click handler
    searchButton.onClick = function() {
        if (searchScope === "comp") {
            if (compDropdown.selection !== null) {
                updateFontList([projectComps[compDropdown.selection.index]]);
            } else {
                alert("Please select a composition first.");
            }
        } else if (searchScope === "selection") {
            var selectedComps = getSelectedCompsFromProjectPanel();
            if (selectedComps.length > 0) {
                updateFontList(selectedComps);
            } else {
                alert("No compositions selected in the Project panel.");
            }
        } else { // searchScope === "project"
            updateFontList(projectComps);
        }
    };
    
    // general error for proj changes in future
    app.onError = function(error) {
        alert(error);
    };
    
    // Make sure panel resizes properly
    panel.layout.layout(true);
    panel.layout.resize();
    panel.layout.resize();
    panel.onResizing = panel.onResize = function() {
        this.layout.resize();
    };
    
    if (panel instanceof Window) {
        panel.show();
    } else {
        panel.layout.layout(true);
    }
}

function populateCompDropdown() {
    // Clear existing items
    compDropdown.removeAll();
    projectComps = [];
    
    // Populate with current project's compositions
    for (var i = 1; i <= app.project.numItems; i++) {
        if (app.project.item(i) instanceof CompItem) {
            projectComps.push(app.project.item(i));
            compDropdown.add("item", app.project.item(i).name);
        }
    }
    
    if (compDropdown.items.length > 0) {
        compDropdown.selection = 0;
    }
}

function updateFontList(comps) {
    fontList.removeAll();
    var fontRecord = [];

    for (var c = 0; c < comps.length; c++) {
        var comp = comps[c];
        
        for (var i = 1; i <= comp.numLayers; i++) {
            try {
                var layer = comp.layer(i);
                
                // Skip non-text layers and those without source text
                if (!(layer instanceof TextLayer) || !layer.text.sourceText) {
                    continue;
                }
                
                var fontName = "Unknown";
                try {
                    fontName = layer.text.sourceText.value.font || "Unknown";
                } catch (e) {
                    fontName = "Error: " + e.message;
                }
                
                var entry = {
                    compName: comp.name,
                    layerName: layer.name,
                    layerIndex: layer.index,
                    fontName: fontName
                };
                
                fontRecord.push(entry);
            } catch (err) {
                // Skip layers that cause errors
                // Could add a debug entry here if needed
            }
        }
    }
    
    populateFontList(fontRecord);
}

function getSelectedCompsFromProjectPanel() {
    var selectedComps = [];
    
    if (app.project.selection) {
        for (var i = 0; i < app.project.selection.length; i++) {
            var item = app.project.selection[i];
            if (item instanceof CompItem) {
                selectedComps.push(item);
            }
        }
    }
    
    return selectedComps;
}

function populateFontList(fontRecord) {
    for (var i = 0; i < fontRecord.length; i++) {
        var entry = fontRecord[i];
        if (entry && entry.layerName !== undefined) {
            var item = fontList.add("item", entry.compName);
            item.subItems[0].text = entry.layerIndex + ": " + entry.layerName;
            item.subItems[1].text = entry.fontName;
        }
    }
}

buildUI();

};

fontWrangler(this);